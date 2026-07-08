# Sprint 6 — Partner jelentkezés-kezelés

Másold be az alábbi SQL-t a Supabase SQL Editorba és futtasd le (CSAK a kód blokk tartalmát, a címsorokat ne):

```sql
create policy "Partner members can update applications for their dogs"
  on adoption_applications for update
  using (is_partner_member(partner_id));
```
