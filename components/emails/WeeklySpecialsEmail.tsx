import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Img,
  Button,
  Section,
} from '@react-email/components'

const siteUrl = 'https://www.lcfoodservice.ca'

export default function WeeklySpecialsEmail({
  headline,
  deliveryCutoff,
  products = [],
}: any) {
  return (
    <Html>
      <Body
        style={{
          backgroundColor: '#f5f1e8',
          fontFamily: 'Arial, sans-serif',
          margin: 0,
          padding: '20px 8px',
        }}
      >
        <Container
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '22px',
            overflow: 'hidden',
          }}
        >
          <Section
            style={{
              backgroundColor: '#244f3d',
              padding: '34px 22px',
              textAlign: 'center',
            }}
          >
            <Heading
              style={{
                color: '#ffffff',
                fontSize: '32px',
                lineHeight: '1.1',
                margin: 0,
              }}
            >
              Local Connect
            </Heading>

            <Text
              style={{
                color: '#d8e5de',
                fontSize: '17px',
                lineHeight: '1.4',
                margin: '12px 0 0',
              }}
            >
              {headline || 'This Week’s Specials'}
            </Text>

            {deliveryCutoff && (
              <Text
                style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  margin: '18px 0 0',
                }}
              >
                Order Cutoff: {deliveryCutoff}
              </Text>
            )}
          </Section>

          <Section style={{ padding: '18px 12px' }}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tbody>
                {products.map((product: any) => (
                  <tr key={product.id}>
                    <td style={{ padding: '10px 0' }}>
                      <Section
                        style={{
                          border: '1px solid #eeeeee',
                          borderRadius: '18px',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {product.image_url && (
                          <Img
                            src={product.image_url}
                            alt={product.name}
                            width="100%"
                            style={{
                              display: 'block',
                              width: '100%',
                              maxHeight: '240px',
                              objectFit: 'contain',
                              backgroundColor: '#ffffff',
                            }}
                          />
                        )}

                        <Section style={{ padding: '18px' }}>
                          <Heading
                            as="h3"
                            style={{
                              fontSize: '22px',
                              lineHeight: '1.15',
                              color: '#1f2f26',
                              margin: '0 0 10px',
                            }}
                          >
                            {product.name}
                          </Heading>

                          {product.description && (
                            <Text
                              style={{
                                fontSize: '15px',
                                color: '#666666',
                                lineHeight: '1.45',
                                margin: '0 0 14px',
                              }}
                            >
                              {product.description.length > 120
                                ? `${product.description.slice(0, 120)}...`
                                : product.description}
                            </Text>
                          )}

                          <Text
                            style={{
                              fontSize: '22px',
                              fontWeight: 'bold',
                              color: '#244f3d',
                              margin: '0',
                              lineHeight: '1.2',
                            }}
                          >
                            {product.price
                              ? `$${Number(product.price).toFixed(2)}`
                              : 'Contact for pricing'}
                          </Text>

                          {product.unit && (
                            <Text
                              style={{
                                fontSize: '14px',
                                color: '#777777',
                                margin: '5px 0 0',
                              }}
                            >
                              {product.unit}
                            </Text>
                          )}

                          <Button
                            href={`${siteUrl}/products?product=${encodeURIComponent(
                              product.id
                            )}`}
                            style={{
                              backgroundColor: '#244f3d',
                              color: '#ffffff',
                              padding: '13px 20px',
                              borderRadius: '999px',
                              textDecoration: 'none',
                              display: 'inline-block',
                              marginTop: '16px',
                              fontWeight: 'bold',
                              fontSize: '15px',
                            }}
                          >
                            View Product
                          </Button>
                        </Section>
                      </Section>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section
            style={{
              padding: '22px 24px 38px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                color: '#777777',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              Need something else added to your order?
              <br />
              Just reply to this email.
            </Text>

            <Button
              href={`${siteUrl}/products`}
              style={{
                backgroundColor: '#1d1d1b',
                color: '#ffffff',
                padding: '14px 24px',
                borderRadius: '999px',
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
                fontWeight: 'bold',
              }}
            >
              View Full Catalog
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}