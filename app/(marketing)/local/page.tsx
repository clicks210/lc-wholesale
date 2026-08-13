import { supabaseAdmin } from '@/lib/supabaseAdmin'
import RestaurantDirectory from './RestaurantDirectory'

type RestaurantRow = {
  id: string
  business_name: string | null
  slug: string | null
  delivery_city: string | null
  profile_description: string | null
  logo_url: string | null
}

export default async function LocalRestaurantDirectoryPage() {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select(`
      id,
      business_name,
      slug,
      delivery_city,
      profile_description,
      logo_url
    `)
    .eq('public_profile', true)
    .not('slug', 'is', null)
    .order('business_name', { ascending: true })

  if (error) {
    console.error('Failed to load public restaurants:', error)
  }

  const restaurants = (data ?? []) as RestaurantRow[]

  const formattedRestaurants = restaurants
    .filter(
      (
        restaurant
      ): restaurant is RestaurantRow & {
        business_name: string
        slug: string
      } =>
        Boolean(
          restaurant.business_name?.trim() &&
            restaurant.slug?.trim()
        )
    )
    .map((restaurant) => {
      const initials = restaurant.business_name
        .split(' ')
        .filter((word: string) => word.length > 0)
        .slice(0, 2)
        .map((word: string) => word.charAt(0).toUpperCase())
        .join('')

      const city = restaurant.delivery_city?.trim()

      return {
        id: restaurant.id,
        name: restaurant.business_name,
        slug: restaurant.slug,

        // Comes directly from customers.logo_url
        logoUrl: restaurant.logo_url,

        location: city
          ? `${city}, BC`
          : 'British Columbia',

        initials: initials || 'LC',

        description:
          restaurant.profile_description?.trim() ||
          'Discover the local producers and products supplied to this restaurant.',
      }
    })

  return <RestaurantDirectory restaurants={formattedRestaurants} />
}