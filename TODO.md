# TODO

- [x] Add DB-backed catalog endpoint `GET /api/products` supporting category/search/maxPrice/sort/pagination.

- [ ] Add repository helper(s) for filtered catalog queries with normalization.

- [x] Update client service `client/src/services/api.ts` to call the new endpoint.


- [x] Refactor `client/src/pages/ProductCatalog.tsx` so filters (category/search/maxPrice/sort) and pagination are applied via DB (no client-side filtering).


- [x] Update count label to use `pagination.total` from API.

- [ ] Run TypeScript build/tests (server + client) and fix any TS issues.

