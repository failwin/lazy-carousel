const testsContext = require.context('.', true, /\.Spec$/);
testsContext.keys().forEach(testsContext);

const jsTestsContext = require.context('../js', true, /\.Spec$/);
jsTestsContext.keys().forEach(jsTestsContext);
