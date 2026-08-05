# Add demo data to the banking dashboard

The database is live but completely empty — no users, profiles, accounts, or transactions. Since every row is tied to a signed-in user (access rules scope data to the owner), demo data has to belong to a real account.

## Step 1: You sign up

Create an account through the app's signup screen (you are currently on `/login`). Tell me once you're in, and I'll seed data onto that account.

## Step 2: I seed realistic demo data

For your user:

- **Profile** — filled out with name, phone, date of birth, address, verified flags, and KYC marked approved so the dashboard shows a complete profile.
- **Two accounts** — a Checking account (~$12,480 balance) and a Savings account (~$38,200), each with an auto-issued account number.
- **~40 transactions spanning the last 6 months** — salary deposits, rent, groceries, utilities, dining, transport, shopping, subscriptions, plus a few transfers between checking and savings.

The transaction dates and mix are chosen so the analytics widgets look convincing: the balance trend chart shows a rising line with realistic dips, and the expense breakdown chart shows several distinct spending categories rather than one flat bar.

## Notes

- Balances are written to match the transaction history so the totals add up.
- Since balances are server-controlled by protective triggers, seeding goes in through a privileged data write rather than the app.
- Nothing in the app's code or UI changes — this is data only.

## Alternative if you'd rather not sign up first

I can instead add a small "Load demo data" action in the dashboard that generates this same sample history for whoever is signed in. Say the word if you prefer that.
