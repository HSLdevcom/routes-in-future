var Spinner = React.createClass({
  render: function() {
    var spinnerSrc = "../../images/loading.svg"

    var contents = <div className='spinner'>
                    <img src={spinnerSrc} />
                    <div>
                      <h3>Haetaan reittejä</h3>
                    </div>
                   </div>;

    return contents;

  }
});
