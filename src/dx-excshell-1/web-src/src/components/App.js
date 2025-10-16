/* 
* <license header>
*/






import React, { useEffect } from 'react'
import { Provider, defaultTheme, Grid, View } from '@adobe/react-spectrum'
import ErrorBoundary from 'react-error-boundary'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import TopNavigation from './common/TopNavigation'
import { Home } from './Home'
import { About } from './About'
import BrandManagerView from './layout/BrandManagerView'
import RulesConfigurationView from './layout/RulesConfigurationView'
import WorkfrontRequestForm from './layout/WorkfrontRequestForm'
import { apiService } from '../services/api'






function App(props) {
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

  useEffect(() => {
    const apiBaseUrl = `https://${safeViewProps.aioRuntimeNamespace}.adobeio-static.net/api/v1/web/${safeViewProps.aioActionPackageName}`;
    apiService.initialize(apiBaseUrl, safeViewProps.imsToken, safeViewProps.imsOrg);
    return () => {
      apiService.clear();
    };
  }, [])

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
              <TopNavigation viewProps={safeViewProps} />
            </View>
            <View gridArea='content' padding='size-200'>
              <Routes>
                <Route path='/' element={<Home viewProps={safeViewProps} />} />
                <Route path='/brand_manager' element={<BrandManagerView viewProps={safeViewProps} />} />
                <Route path='/rules_manager' element={<RulesConfigurationView viewProps={safeViewProps} />} />
                <Route path='/workfront_requests' element={<WorkfrontRequestForm viewProps={safeViewProps} />} />
                <Route path='/about' element={<About viewProps={safeViewProps} />} />
              </Routes>
            </View>
          </Grid>
        </Provider>
      </Router>
    </ErrorBoundary>
  )

  // Methods

  // error handler on UI rendering failure
  function onError(e, componentStack) { }

  // component to show if UI fails rendering
  function fallbackComponent({ componentStack, error }) {
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
