const testsContext = require.context('.', true, /\Spec$/);
testsContext.keys().forEach(testsContext);

//const jsTestsContext = require.context('../src', true, /\Spec$/);
//jsTestsContext.keys().forEach(jsTestsContext);
