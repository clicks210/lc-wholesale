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
  const productRows = Array.from({
    length: Math.ceil(products.length / 2),
  })

  return (
    <Html>
      <Body
        style={{
          backgroundColor: '#f5f1e8',
          fontFamily: 'Arial, sans-serif',
          margin: 0,
          padding: '32px 12px',
        }}
      >
        <Container
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          <Section
            style={{
              backgroundColor: '#244f3d',
              padding: '40px 32px',
              textAlign: 'center',
            }}
          >
            <Heading
              style={{
                color: '#ffffff',
                fontSize: '36px',
                margin: 0,
              }}
            >
              Local Connect
            </Heading>

            <Text
              style={{
                color: '#d8e5de',
                fontSize: '18px',
                marginTop: '12px',
              }}
            >
              {headline || 'This Week’s Specials'}
            </Text>

            {deliveryCutoff && (
              <Text
                style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  marginTop: '20px',
                }}
              >
                Order Cutoff: {deliveryCutoff}
              </Text>
            )}
          </Section>

          <Section style={{ padding: '24px' }}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tbody>
                {productRows.map((_, rowIndex) => {
                  const left = products[rowIndex * 2]
                  const right = products[rowIndex * 2 + 1]

                  return (
                    <tr key={rowIndex}>
                      {[left, right].map((product: any, index) => (
                        <td
                          key={index}
                          width="50%"
                          valign="top"
                          style={{
                            padding: '10px',
                          }}
                        >
                          {product && (
                            <Section
                              style={{
                                border: '1px solid #eee',
                                borderRadius: '18px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                              }}
                            >
                              {product.image_url && (
                                <Img
                                  src={product.image_url}
                                  width="100%"
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '170px',
                                    objectFit: 'cover',
                                  }}
                                />
                              )}

                              <Section style={{ padding: '16px' }}>
                                <Heading
                                  as="h3"
                                  style={{
                                    fontSize: '19px',
                                    lineHeight: '1.25',
                                    color: '#1f2f26',
                                    margin: '0 0 10px',
                                  }}
                                >
                                  {product.name}
                                </Heading>

                                {product.description && (
                                  <Text
                                    style={{
                                      fontSize: '14px',
                                      color: '#666666',
                                      lineHeight: '1.5',
                                      margin: '0 0 12px',
                                    }}
                                  >
                                    {product.description.length > 95
                                      ? `${product.description.slice(0, 95)}...`
                                      : product.description}
                                  </Text>
                                )}

                                <Text
                                  style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: '#244f3d',
                                    margin: '0',
                                  }}
                                >
                                  {product.price
                                    ? `$${Number(product.price).toFixed(2)}`
                                    : 'Contact for pricing'}
                                </Text>

                                {product.unit && (
                                  <Text
                                    style={{
                                      fontSize: '13px',
                                      color: '#777777',
                                      margin: '4px 0 0',
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
                                    padding: '12px 18px',
                                    borderRadius: '999px',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                    marginTop: '14px',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                  }}
                                >
                                  View Product
                                </Button>
                              </Section>
                            </Section>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Section>

          <Section
            style={{
              padding: '24px 32px 40px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                color: '#777777',
                fontSize: '14px',
                lineHeight: '1.6',
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