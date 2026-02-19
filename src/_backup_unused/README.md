# Backup – Unused or Deprecated Files

These files were moved here during project cleanup. They are **not referenced** by the app.

- **verifyToken.js** – Token verification utility; not imported anywhere. Can be re-enabled if needed for route guards.
- **usersSlice.js** – Redux user slice (was `reducers/users.js`). App uses `authSlice` only; this was never wired in store.
- **LoginPageEmail.jsx** – Staff email-only login page. Not in routes; main `LoginPage` supports both phone and email login.

To restore: move the file back to the appropriate folder and fix any import paths.
