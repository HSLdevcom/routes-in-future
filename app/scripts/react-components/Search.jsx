
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
var Search = React.createClass({
  getInitialState: function() {
    return {hasLocation: 'to',suggestions:[]};
  },
  componentWillMount : function() {
    //this.context.getStore('LocationStore').addChangeListener(this.onChange);
    //return this.setState(this.context.getStore('LocationStore').getLocationState());
  },

  componentWillUnmount : function() {
    //return this.context.getStore('LocationStore').removeChangeListener(this.onChange);
  },

  onChange : function() {
    //return this.setState(this.context.getStore('LocationStore').getLocationState());
  },

  setLocation : function(lat, lon, address) {
    return this.props.setResult({lat:lat,lon:lon},this.props.aid);
  },

  getSuggestions : function(input, callback) {
    var queryParams = $.param({
      'focus.point.lat': '60.1747',
      'focus.point.lon': '24.8012',
      'boundary.rect.min_lat': '59.9',
      'boundary.rect.max_lat': '60.45',
      'boundary.rect.min_lon': '24.3',
      'boundary.rect.max_lon': '25.5',
      'text': input
    });
    $.getJSON('http://api.digitransit.fi/geocoding/v1/search?' + queryParams)
    .then(function(data){
      callback(null, data.features);
    });
  },

  renderSuggestion : function(suggestion, input) {
    var afterMatch, beforeMatch, firstMatchIndex, icon, lastMatchIndex, match, reqex, value;
    value = suggestion.properties.label;
    reqex = new RegExp('\\b' + value, 'i');
    firstMatchIndex = value.toLowerCase().indexOf(input.toLowerCase());
    lastMatchIndex = firstMatchIndex + input.length;
    icon = "<svg viewBox=\"0 0 40 40\" class=\"icon\"><use xlink:href=\"#icon-icon_place\"></use></svg>";
    if (firstMatchIndex === -1) {
      return React.createElement("span", null, React.createElement("span", {
        "dangerouslySetInnerHTML": {
          __html: icon
        }
      }), value);
    }
    beforeMatch = value.slice(0, firstMatchIndex);
    match = value.slice(firstMatchIndex, lastMatchIndex);
    afterMatch = value.slice(lastMatchIndex, value.length);
    return React.createElement("span", {
      "id": value
    }, React.createElement("span", {
      "dangerouslySetInnerHTML": {
        __html: icon
      }
    }), beforeMatch, React.createElement("strong", null, match), afterMatch);
  },

  suggestionValue : function(suggestion) {
    return suggestion.properties.label;
  },

  suggestionSelected : function(suggestion, e) {
    e.preventDefault();
    this.setLocation(suggestion.geometry.coordinates[1], suggestion.geometry.coordinates[0], suggestion.properties.label);
  },

  handleAutoSuggestMount : function(autoSuggestComponent) {
    var input;
    if (autoSuggestComponent) {
      input = autoSuggestComponent.refs.input.getDOMNode();
      input.addEventListener('keydown', this.suggestionArrowPress);
      return this.autoSuggestInput = input;
    }
  },

  suggestionArrowPress : function(e) {
    var autoSuggestDiv, autoSuggestDivs, selectedSuggestion, suggestions;
    if(e.which === 9) {
       analyzed = this.analyzeInput(this.autoSuggestInput.value);
       return this.findLocation(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber);
    }
    if (e.which !== 38 && e.which !== 40) {
      return;
    }
    suggestions = document.getElementsByClassName("react-autosuggest__suggestion--focused");
    if (suggestions.length === 0) {
      return;
    }
    selectedSuggestion = suggestions[0];
    autoSuggestDivs = document.getElementsByClassName("react-autosuggest__suggestions");
    if (autoSuggestDivs.length === 0) {
      return;
    }
    autoSuggestDiv = autoSuggestDivs[0];
    if (e.which === 38) {
      return autoSuggestDiv.scrollTop = selectedSuggestion.offsetTop - 90;
    } else if (e.which === 40) {
      return autoSuggestDiv.scrollTop = selectedSuggestion.offsetTop - 60;
    }
  },
  onSubmit : function(e) {
    var analyzed;
    e.preventDefault();
    analyzed = this.analyzeInput(this.autoSuggestInput.value);
    return this.findLocation(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber);
  },

  render : function() {
    var inputAttributes, inputDisabled;
    inputDisabled = "";
    inputAttributes = {
      id: this.props.aid,
      placeholder: this.props.placeholder,
      disabled: inputDisabled
    };
    return (
    <form onSubmit={this.onSubmit}>
      <Autosuggest
        id={this.props.aid}
        ref={this.handleAutoSuggestMount}
        key={this.props.aid}
        inputAttributes={inputAttributes}
        suggestions={this.getSuggestions}
        suggestionRenderer={this.renderSuggestion}
        suggestionValue={this.suggestionValue}
        onSuggestionSelected={this.suggestionSelected}
        showWhen={((function(_this) {
          return function(input) {
            return input.trim().length >= 2;
          };
        })(this))} />
    </form>
    );
  }
});
