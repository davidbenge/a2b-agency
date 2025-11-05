/*
* <license header>
*/

import React from 'react'
import { 
  Heading, 
  View, 
  Text, 
  Flex, 
  Content, 
  Divider,
  IllustratedMessage
} from '@adobe/react-spectrum'

import { CreateRuleBuilder } from './rules-manager/create-rule/CreateRuleBuilder'
import { CreateForm } from './rules-manager/CraeteForm'


export const RulesManagerView = ({ viewProps }) => (
  <View>
    <Content>
      <Flex direction='column' gap='size-300'>
        <Heading level={1}>Rules Manager</Heading>
         <CreateForm/>
      </Flex>
    </Content>
  </View>
)

export default RulesManagerView
