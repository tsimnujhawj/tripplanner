var map;
var bounds;
var recommendedMarkers = [];
var selectedMarkers = [];
var recommendedBounds = [];
var selectedBounds = [];
let app = {

  //helper function that removes spaces and replaces with +
  formatAddress: function(address) {
    let newString = address.replace(/\s/g, '+');
    return newString;
  },

  startLocation: {lat: null, lng: null},

  stopNum: 0,
  // Geocoding -> takes street address and returns lat and lng
  //address=567+Maple+Street,+Pittsburgh,+PA&key=etc.
  googleGeocodingEndpoint: 'https://maps.googleapis.com/maps/api/geocode/json?',

  start: function() {

    let address = $('#loc-input').val().trim();

    // empty address element
    $('#loc-input').val('');

    // turn spaces into plusses with regex
    let formattedAddress = this.formatAddress(address);

    //build queryString
    let queryString = this.googleGeocodingEndpoint + 'address=' + formattedAddress + '&key=AIzaSyAZ-lWaRXK1_nq2EXYxkNiXe2CrkLNee-o';

    //ajax
    $.ajax({
      url: queryString,
      method: 'GET',
      error: function(_first, _second, _third) {
        console.log("Geocoding failed - It's Google's fault");
      }
    }).then(function(response) {
      console.log('Latitude : ' + response.results[0].geometry.location.lat);
      console.log('Longitude : ' + response.results[0].geometry.location.lng);
      let lat = parseFloat(response.results[0].geometry.location.lat);
      let lng = parseFloat(response.results[0].geometry.location.lng);

      initMap(lat, lng);
      app.startLocation.lat = lat;
      app.startLocation.lng = lng;
      app.recommendPlaces(lat, lng);
    });
  },

  newAddress: function() {
    let address = $('#new-address-input').val().trim();

    // empty address element
    $('#new-address-input').val('');

    // turn spaces into plusses with regex
    let formattedAddress = this.formatAddress(address);

    //build queryString
    let queryString = this.googleGeocodingEndpoint + 'address=' + formattedAddress + '&key=AIzaSyAZ-lWaRXK1_nq2EXYxkNiXe2CrkLNee-o';

    $.ajax({
      url: queryString,
      method: 'GET',
      error: function(_first, _second, _third) {
        console.log("Geocoding failed - It's Google's fault");
      }
    }).then(function(response) {
      console.log('Latitude : ' + response.results[0].geometry.location.lat);
      console.log('Longitude : ' + response.results[0].geometry.location.lng);
      let lat = parseFloat(response.results[0].geometry.location.lat);
      let lng = parseFloat(response.results[0].geometry.location.lng);

      let latlng = new google.maps.LatLng(lat, lng);
      app.selectStop(latlng);
      app.recommendPlaces(lat, lng);
    });
  },

  selectStop: function(latlng) {
      // When we run this function, we're saying let's add this as a place we want to visit onto the list of stops and let's add a permanent marker to the map

      this.stopNum++;
      var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: 'Stop: ' + app.stopNum
      });
      selectedMarkers.push(marker);
      bounds.extend(latlng);
  },

  recommendPlaces: function(lat, lng) {
    this.clearRecommendedMarkers();
    $('.rec').remove();
    let placeBase = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyAZ-lWaRXK1_nq2EXYxkNiXe2CrkLNee-o&location=' + lat + ',' + lng + '&rankby=prominence&radius=5000' + '&type=bar';
    $.ajax({
      url: placeBase,
      method: 'GET',
      error: function(_first, _second, _third) {
        console.log("Failed");
      }
    }).then(function(r) {
      for (let i = 0; i < 10; i++) {
        let row = $('<tr>');
        let number = $('<td>').text(i + 1);
        let name = $('<td>').text(r.results[i].name);
        let address = $('<td>').text(r.results[i].vicinity);
        let rating = $('<td>').text(r.results[i].rating);
        row.append(number);
        row.append(name);
        row.append(address);
        row.append(rating);
        row.attr('data-lat', r.results[i].geometry.location.lat);
        row.attr('data-lng', r.results[i].geometry.location.lng);
        row.addClass('rec');
        $('#recommendations').append(row);
        let bound = new google.maps.LatLng(r.results[i].geometry.location.lat, r.results[i].geometry.location.lng);
        app.addRecommendedMarker(bound, r.results[i].name);
      }
      app.centerMap();
    }
    );
  },

  addRecommendedMarker: function(bound, name) {
    var marker = new google.maps.Marker({
      position: bound,
      map: map,
      title: name
    });
    recommendedMarkers.push(marker);
    bounds.extend(bound);
  },

  clearRecommendedMarkers: function() {
    for (let i = 0; i < recommendedMarkers.length; i++){
        recommendedMarkers[i].setMap(null);
    }
    recommendedMarkers = [];
  },

  centerMap: function() {
    map.fitBounds(bounds);
  }
}

//END APP

//Initialize Google map

function initMap(startLat, startLong) {
        var myLatLng = new google.maps.LatLng(startLat, startLong);

        map = new google.maps.Map(document.getElementById('map-display'), {
          zoom: 15,
          center: myLatLng
        });
        bounds = new google.maps.LatLngBounds();
        app.selectStop(myLatLng);
}

//DOM Listeners

$(document).on('click', '#form-submit', function(event) {
  event.preventDefault();
  app.start();
});

$(document).on('click', '#new-form-submit', function(event) {
  event.preventDefault();
  app.newAddress();
});

$(document).on('click', '.rec', function(event) {
  let lat = $(this).attr('data-lat');
  let lng = $(this).attr('data-lng');
  let latlng = new google.maps.LatLng(lat, lng);
  app.selectStop(latlng);
  app.recommendPlaces(lat, lng);
});


// More listeners

$(document).on('click', '#add-btn', function(event) {
  event.preventDefault();
  // show the map
  $('.map-box').css('display', 'block');
  $('.added-box').css('display', 'block');
  $('.recommend-box').css('display', 'block');
  app.start();
});
