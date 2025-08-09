/*
* <license header>
*/

import React from 'react'
import { Heading, View, Text, Flex, Content, Divider } from '@adobe/react-spectrum'
import { ENABLE_DEMO_MODE } from '../utils/demoMode'

export const Home = () => (
  <View maxWidth="size-6000">
    <Content>
      <Flex direction='column' gap='size-300'>
        <Heading level={1}>Welcome to Agency Portal</Heading>
        
        <Divider size="S" />
        
        <Text>
          This is the Agency side of the Brand to Agency solution. Here you can register 
          with brands, manage asset synchronization, and monitor sync status between 
          your agency and brand-owned AEM environments.
        </Text>
        
        {ENABLE_DEMO_MODE && (
          <View 
            backgroundColor="blue-100" 
            padding="size-200" 
            borderRadius="medium"
            borderWidth="thin"
            borderColor="blue-300"
          >
            <Flex direction="column" gap="size-100">
              <Heading level={3}>Demo Mode Features</Heading>
              <Text>
                • Brand registration form with simulated API responses<br/>
                • Asset management and synchronization tools<br/>
                • Sync status monitoring and tracking<br/>
                • Realistic delays and user feedback
              </Text>
            </Flex>
          </View>
        )}
        
        <Flex direction="column" gap="size-200">
          <Heading level={2}>Getting Started</Heading>
          <Text>
            Use the navigation menu above to:
          </Text>
          <View paddingStart="size-200">
            <Text>
              • <strong>Brand Registration</strong>: Register with new brands<br/>
              • <strong>Asset Management</strong>: Manage and sync assets<br/>
              • <strong>Sync Status</strong>: Monitor synchronization status<br/>
              • <strong>About</strong>: Learn more about the application
            </Text>
          </View>
        </Flex>
      </Flex>
    </Content>
  </View>
)
