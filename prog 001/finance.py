# ============================================
# Personal Finance Tracker - Version 2
# Now with saving/loading!
# ============================================

import json  # Built-in Python library for reading/writing JSON files

# The file where we'll store transactions
DATA_FILE = "transactions.json"


def load_transactions():
    """Load transactions from the JSON file. Return empty list if no file exists."""
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        # First time running — no file yet, that's fine
        return []


def save_transactions(transactions):
    """Save all transactions to the JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(transactions, f, indent=2)


def add_transaction(transactions):
    """Ask the user for details and add a transaction."""

    # Get the type: income or expense
    print("\nIs this income or an expense?")
    print("  1. Income")
    print("  2. Expense")
    choice = input("Enter 1 or 2: ")

    if choice == "1":
        trans_type = "income"
    elif choice == "2":
        trans_type = "expense"
    else:
        print("Invalid choice. Try again.")
        return

    # Get the description
    description = input("Description (e.g. 'Salary', 'Coffee'): ")

    # Get the amount
    try:
        amount = float(input("Amount: $"))
    except ValueError:
        print("That's not a valid number. Try again.")
        return

    # Create the transaction and add it to our list
    transaction = {
        "type": trans_type,
        "description": description,
        "amount": amount,
    }
    transactions.append(transaction)
    save_transactions(transactions)  # <-- NEW: save after every addition
    print(f"Added: {trans_type} — {description} — ${amount:.2f}")


def view_transactions(transactions):
    """Print all transactions and the current balance."""

    if len(transactions) == 0:
        print("\nNo transactions yet.")
        return

    print("\n--- Your Transactions ---")
    balance = 0.0

    for t in transactions:
        if t["type"] == "income":
            sign = "+"
            balance += t["amount"]
        else:
            sign = "-"
            balance -= t["amount"]

        print(f"  {sign} ${t['amount']:.2f}  ({t['description']})")

    print(f"\n  Balance: ${balance:.2f}")
    print("-------------------------")


# ============================================
# Main loop
# ============================================

print("=== Personal Finance Tracker ===")

# Load any previously saved transactions
transactions = load_transactions()
print(f"Loaded {len(transactions)} saved transaction(s).")

while True:
    print("\nWhat would you like to do?")
    print("  1. Add a transaction")
    print("  2. View transactions")
    print("  3. Quit")

    choice = input("Enter 1, 2, or 3: ")

    if choice == "1":
        add_transaction(transactions)
    elif choice == "2":
        view_transactions(transactions)
    elif choice == "3":
        print("Goodbye!")
        break
    else:
        print("Invalid choice. Please enter 1, 2, or 3.")
