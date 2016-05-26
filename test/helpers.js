(function(){

    var style;
    var seen = [];

    function injectCss(rules){
        if ( seen.indexOf(rules) !== -1 ){
            return;
        }

        style = style || (function() {
                var _style = document.createElement('style');
                _style.appendChild(document.createTextNode(''));
                document.head.appendChild(_style);
                return _style;
            })();

        seen.push(rules);
        style.innerHTML += '\n' + rules;
    }

    injectCss.reset = function(){
        if ( style ) {
            document.head.removeChild(style);
        }
        style = null;
        seen = [];
    };

    function injectCssByUrl(url){

        var _style = document.createElement('link');
        _style.rel = "stylesheet";
        _style.href = url;

        document.head.appendChild(_style);

        return function clear() {
            document.head.removeChild(_style);
        }
    }

    window.__helpers = {
        injectCss: injectCss,
        injectCssByUrl: injectCssByUrl
    };
})();
