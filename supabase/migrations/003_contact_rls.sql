-- Allow anonymous users to submit adoption applications
-- This enables the contact form for logged-out users
create policy "Anyone can submit adoption application"
  on adoption_applications for insert
  with check (true);
