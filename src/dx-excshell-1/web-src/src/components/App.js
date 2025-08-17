/* 
* <license header>
*/

import React from 'react'
import { Provider, defaultTheme, Grid, View } from '@adobe/react-spectrum'
import ErrorBoundary from 'react-error-boundary'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import SpectrumHeader from './common/SpectrumHeader'
import SideBar from './common/SideBar'
import { Home } from './Home'
import { About } from './About'
import BrandManagerView from './layout/BrandManagerView'

function App (props) {
  console.log('runtime object:', props.runtime)
  console.log('viewProps object:', props.viewProps)

  // Safe access to viewProps and ims with fallbacks
  const safeViewProps = props.viewProps || {};
  const safeIms = safeViewProps.ims || {};

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on('configuration', (props) => {
    console.log('Ready! received on configuration:', props)
    //console.log('configuration change', { imsOrg, imsToken, locale })
  })

  // respond to history change events
  props.runtime.on('history', ({ type, path }) => {
    console.log('history change', { type, path })
  })

  return (
    <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
      <Router>
        <Provider theme={defaultTheme} colorScheme={'light'}>
          <Grid
            areas={['header', 'content']}
            columns={['1fr']}
            rows={['auto', '1fr']}
            height='100vh'
            gap='size-100'
          >
            <View gridArea='header'>
              <SpectrumHeader viewProps={safeViewProps} />
            </View>
            <View gridArea='content' padding='size-200'>
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/brand_manager' element={<BrandManagerView viewProps={props.viewProps} />}/>
                <Route path='/about' element={<About />}/>
              </Routes>
            </View>
          </Grid>
        </Provider>
      </Router>
    </ErrorBoundary>
  )

  // Methods

  // error handler on UI rendering failure
  function onError (e, componentStack) { }

  // component to show if UI fails rendering
  function fallbackComponent ({ componentStack, error }) {
    return (
      <React.Fragment>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>
          Something went wrong :(
        </h1>
        <pre>{componentStack + '\n' + error.message}</pre>
      </React.Fragment>
    )
  }
}

export default App
