"""
Plaid Integration Service
"""

import plaid
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os

class PlaidService:
    """Service for Plaid API operations"""
    
    def __init__(self):
        # Initialize Plaid client
        configuration = plaid.Configuration(
            host=plaid.Environment.sandbox,
            api_key={
                'clientId': os.getenv('PLAID_CLIENT_ID'),
                'secret': os.getenv('PLAID_SECRET')
            }
        )
        
        api_client = plaid.ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)
    
    async def create_link_token(self, user_id: str) -> Optional[str]:
        """Create a link token for Plaid Link"""
        try:
            request = LinkTokenCreateRequest(
                products=[Products('transactions'), Products('auth')],
                client_name="FinQuest",
                country_codes=[CountryCode('US')],
                language='en',
                user=LinkTokenCreateRequestUser(client_user_id=user_id)
            )
            
            response = self.client.link_token_create(request)
            return response['link_token']
        except Exception as e:
            print(f"Error creating link token: {e}")
            return None
    
    async def exchange_public_token(self, public_token: str) -> Optional[str]:
        """Exchange public token for access token"""
        try:
            request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = self.client.item_public_token_exchange(request)
            return response['access_token']
        except Exception as e:
            print(f"Error exchanging public token: {e}")
            return None
    
    async def get_accounts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get account information"""
        try:
            request = AccountsGetRequest(access_token=access_token)
            response = self.client.accounts_get(request)
            
            accounts = []
            for account in response['accounts']:
                accounts.append({
                    'account_id': account['account_id'],
                    'name': account['name'],
                    'type': account['type'],
                    'subtype': account.get('subtype'),
                    'mask': account.get('mask'),
                    'official_name': account.get('official_name'),
                    'balances': {
                        'available': account['balances'].get('available'),
                        'current': account['balances'].get('current'),
                        'limit': account['balances'].get('limit')
                    }
                })
            
            return accounts
        except Exception as e:
            print(f"Error getting accounts: {e}")
            return []
    
    async def get_transactions(self, access_token: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get transactions for a date range"""
        try:
            options = TransactionsGetRequestOptions(
                start_date=start_date.date(),
                end_date=end_date.date()
            )
            
            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date.date(),
                end_date=end_date.date(),
                options=options
            )
            
            response = self.client.transactions_get(request)
            
            transactions = []
            for transaction in response['transactions']:
                transactions.append({
                    'transaction_id': transaction['transaction_id'],
                    'account_id': transaction['account_id'],
                    'amount': transaction['amount'],
                    'date': transaction['date'],
                    'name': transaction['name'],
                    'merchant_name': transaction.get('merchant_name'),
                    'category': transaction.get('category', []),
                    'subcategory': transaction.get('subcategory', []),
                    'pending': transaction.get('pending', False),
                    'account_owner': transaction.get('account_owner')
                })
            
            return transactions
        except Exception as e:
            print(f"Error getting transactions: {e}")
            return []
    
    async def get_recent_transactions(self, access_token: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent transactions"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        return await self.get_transactions(access_token, start_date, end_date)
    
    async def categorize_transaction(self, transaction: Dict[str, Any]) -> str:
        """Categorize a transaction based on Plaid categories"""
        categories = transaction.get('category', [])
        if not categories:
            return 'other'
        
        # Map Plaid categories to our categories
        category_mapping = {
            'Food and Drink': 'food_dining',
            'Transportation': 'transportation',
            'Entertainment': 'entertainment',
            'Shops': 'shopping',
            'Bills and Utilities': 'bills_utilities',
            'Healthcare': 'healthcare',
            'Education': 'education',
            'Travel': 'travel',
            'Recreation': 'entertainment',
            'Service': 'other'
        }
        
        primary_category = categories[0] if categories else 'Other'
        return category_mapping.get(primary_category, 'other')
    
    async def get_spending_insights(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze spending patterns from transactions"""
        if not transactions:
            return {}
        
        # Calculate totals by category
        category_totals = {}
        merchant_totals = {}
        total_spent = 0
        
        for transaction in transactions:
            amount = abs(transaction['amount'])
            total_spent += amount
            
            # Category analysis
            category = await self.categorize_transaction(transaction)
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += amount
            
            # Merchant analysis
            merchant = transaction.get('merchant_name') or transaction.get('name', 'Unknown')
            if merchant not in merchant_totals:
                merchant_totals[merchant] = 0
            merchant_totals[merchant] += amount
        
        # Sort categories and merchants by amount
        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        top_merchants = sorted(merchant_totals.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'total_spent': total_spent,
            'category_breakdown': category_totals,
            'top_categories': top_categories[:5],
            'top_merchants': top_merchants[:10],
            'transaction_count': len(transactions)
        }
