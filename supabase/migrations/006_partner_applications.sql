-- Sprint 6: Partners can update (change status of) applications for their dogs

create policy "Partner members can update applications for their dogs"
  on adoption_applications for update
  using (is_partner_member(partner_id));
