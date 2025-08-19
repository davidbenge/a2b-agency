/* 
* <license header>
*/

import { Heading, View, Content, Link, Text, Flex, Divider } from '@adobe/react-spectrum'

export const About = ({ viewProps }) => (
  <View maxWidth="size-6000">
    <Content>
      <Flex direction="column" gap="size-300">
        <Heading level={1}>About Agency Portal</Heading>
        <Divider size="S" />
        
        <Text>
          This is the Agency side of the Brand to Agency (B2A) solution, built using Adobe App Builder. 
          This portal allows agencies to register with brands, manage asset workflows, and monitor 
          synchronization status with brand-owned AEM environments.
        </Text>
        
        <Heading level={2}>Agency Features</Heading>
        <View paddingStart="size-200">
          <Text>
            • <strong>Brand Registration</strong>: Register your agency with multiple brands<br/>
            • <strong>Asset Management</strong>: Manage and organize synchronized assets<br/>
            • <strong>Sync Monitoring</strong>: Track asset synchronization status in real-time<br/>
            • <strong>Demo Mode</strong>: Comprehensive demo functionality for development and testing
          </Text>
        </View>
        
        <Heading level={2}>Technologies Used</Heading>
        <View paddingStart="size-200">
          <Text>
            • Adobe App Builder & I/O Runtime<br/>
            • Adobe React Spectrum Design System<br/>
            • React 16.13.1 with TypeScript<br/>
            • Adobe Experience Cloud Shell<br/>
            • CloudEvents Specification
          </Text>
        </View>
        
        <Heading level={2}>Useful Documentation</Heading>
        <Content>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://github.com/AdobeDocs/project-firefly/blob/master/README.md#project-firefly-developer-guide' target='_blank'>
                  Adobe Developer App Builder
                </a>
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://github.com/adobe/aio-sdk#adobeaio-sdk' target='_blank'>
                  Adobe I/O SDK
                </a>
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://adobedocs.github.io/adobeio-runtime/' target='_blank'>
                  Adobe I/O Runtime
                </a>
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://react-spectrum.adobe.com/react-spectrum/index.html' target='_blank'>
                  React Spectrum
                </a>
              </Link>
            </li>
          </ul>
        </Content>
      </Flex>
    </Content>
  </View>
)
