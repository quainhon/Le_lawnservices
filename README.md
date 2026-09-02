# Landscaping Route App

Private, local-first Expo/React Native app for tracking one continuous master
landscaping route.

## Run

```bash
npm install
npm start
```

Then press `i` in the Expo CLI for an iPhone simulator, or scan the QR code
with Expo Go.

## Customer data

The app imports customer records from [`data/customers.json`](./data/customers.json).
The file contains the 50 Marietta prototype properties, including route order,
coordinates, and synthetic weekly/biweekly test scheduling. The expected fields
are defined in [`types/customer.ts`](./types/customer.ts). Replace this file
with the business's real JSON later; preserve the same top-level `customers`
array or update the import in `hooks/useRouteState.tsx`.

## Route behavior

- Week A/B includes all weekly customers plus that cycle's biweekly customers.
- Customers are always sorted by their permanent `route_order`.
- Completion is stored separately by cycle in AsyncStorage and never changes
  `route_order`.
- `DONE` toggles to `UNDO` for local testing.

## Structure

```text
app/
  (tabs)/          Route, Map, Customers, Settings
components/        Reusable customer row
data/              Replaceable customer JSON
hooks/             Local persisted route state
lib/               Route filtering and ordering
types/             Customer and weekly-job types
```

The Map tab uses `react-native-maps` on native builds with permanent route-order
markers and a coordinate list fallback on web. GPS, geofencing, and arrival
detection are TODOs for a later version.
