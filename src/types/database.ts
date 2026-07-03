export type PartnerType =
  | 'shelter' | 'breed_rescue' | 'veterinarian' | 'dog_school'
  | 'boarding' | 'grooming' | 'walker' | 'dog_friendly_place' | 'transport' | 'other'

export type PartnerStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived' | 'suspended'

export type DogGender = 'male' | 'female'
export type DogSize = 'small' | 'medium' | 'large' | 'xlarge'
export type DogStatus = 'available' | 'reserved' | 'pending' | 'foster' | 'adopted' | 'medical' | 'inactive' | 'deceased'

export interface Partner {
  id: string
  name: string
  slug: string
  type: PartnerType
  status: PartnerStatus
  verified: boolean
  description: string | null
  country: string | null
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  cover_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Dog {
  id: string
  partner_id: string
  name: string
  breed: string | null
  mixed_breed: boolean
  age_years: number | null
  age_months: number | null
  gender: DogGender | null
  size: DogSize | null
  color: string | null
  description: string | null
  status: DogStatus
  is_vaccinated: boolean
  is_neutered: boolean
  is_chipped: boolean
  is_dewormed: boolean
  is_transportable: boolean
  good_with_kids: boolean
  good_with_dogs: boolean
  good_with_cats: boolean
  country: string | null
  city: string | null
  primary_image_url: string | null
  created_at: string
  updated_at: string
  partner?: Partner
}
