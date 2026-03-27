# Stationary Shop Manager

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- Product catalog with fields: name, category, cost price, selling price, stock quantity
- Point of Sale (POS) / Billing screen: add items to cart, calculate total, generate printable bill/receipt
- Transaction history: all past sales stored with date, items, totals
- Reports screen: total revenue, total cost (investment), total profit, profit margin
- Navigation between: Products, Billing, Transactions, Reports

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: Products CRUD (name, category, costPrice, sellingPrice, stock)
2. Backend: Transactions - record a sale (list of items bought, quantities), auto-calculate totals
3. Backend: Reports query - aggregate all transactions for profit/investment/revenue totals
4. Frontend: Products page - table with add/edit/delete product modal
5. Frontend: Billing page - search/select products, build cart, show totals, print receipt
6. Frontend: Transactions page - list all past transactions with details
7. Frontend: Reports page - summary cards for revenue, investment, profit
