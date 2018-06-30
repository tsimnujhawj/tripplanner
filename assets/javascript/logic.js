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
  prevLocation: {lat: null, lng: null},

  cost: 0,
  miles: 0,

  stopNum: 0,
  // Geocoding -> takes street address and returns lat and lng
  //address=567+Maple+Street,+Pittsburgh,+PA&key=etc.
  googleGeocodingEndpoint: 'https://maps.googleapis.com/maps/api/geocode/json?',

  start: function() {
    console.log('start ran');
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

      initMap(lat, lng, address);
      app.startLocation.lat = lat;
      app.startLocation.lng = lng;
      app.recommendPlaces(lat, lng);
      app.getCurrentWeather(lat, lng);
    });
  },

  selectStop: function(lat, lng, name, address) {
      // When we run this function, we're saying let's add this as a place we want to visit onto the list of stops and let's add a permanent marker to the map
      let latlng = new google.maps.LatLng(lat, lng);
      this.stopNum++;
      var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: 'Stop: ' + app.stopNum,
        icon: 'http://icons.iconarchive.com/icons/flaticonmaker/flat-style/32/flag-icon.png'
      });
      selectedMarkers.push(marker);
      map.panTo(marker.getPosition());
      // bounds.extend(latlng);

      if (app.prevLocation.lat !== null) {

        //prevLocation not null, run lyft

        let token = 'D3273CWjgD4nlLVR1cS4drTv+VUk/5WbjXoKGilByeLJVkW/uyHh6972avvPLgjEOMxWX+nrtt95AhvbeMMPunTxv03vbIGlf7EqFfyU9WnWS42fbztTCqk=';
        let endLat = lat;
        let endLng = lng;
        let startLat = app.prevLocation.lat;
        let startLng = app.prevLocation.lng;
        let queryURL = 'https://api.lyft.com/v1/cost?&start_lat=' + startLat + '&start_lng=' + startLng + '&end_lat=' + endLat + '&end_lng=' + endLng;

        $.ajax({
            url: queryURL,
            method: "GET",
            dataType: "json",
            headers: {
                Authorzation: token
            }
        }).then(function (response) {
            // we will now sneakily change the prevLocation lat and lng
            console.log(response);
            app.prevLocation.lat = endLat;
            app.prevLocation.lng = endLng;

            // manipulate returned data
            let costCents = response.cost_estimates[0].estimated_cost_cents_max;
            let costDollars = costCents / 100;
            let distance = response.cost_estimates[0].estimated_distance_miles;
            let array = [costDollars, distance];
            app.addStop(name, address, array);
          });
      }
      else {
        let lyft;
        app.prevLocation.lat = lat;
        app.prevLocation.lng = lng;
        this.addStop(name, address, lyft);
      }
  },

  addStop: function(name, address, lyftArray) {
    let cost;
    let miles;
    if (!lyftArray) {
      cost = '0.00';
      miles = '0.00';
    }
    else {
      cost = lyftArray[0];
      miles = lyftArray[1];
    }
    let tbody = $('#recBody');
    let trow = $('<tr>');
    let tdname = $('<td>').text(name);
    let tdaddress = $('<td>').text(address);
    let tdmiles = $('<td>').text(miles);
    let tdcost = $('<td>').text(cost);
    trow.append(tdname);
    trow.append(tdaddress);
    trow.append(tdmiles);
    trow.append(tdcost);
    tbody.append(trow);
    this.cost += parseFloat(cost);
    this.miles += parseFloat(miles);

    this.recalculateTotals();
  },
  recalculateTotals: function() {
    $('#stops-total').text(app.stopNum);
    $('#miles-total').text(app.miles);
    $('#lyft-total').text('$' + app.cost);
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
        row.attr('data-name', r.results[i].name);
        row.attr('data-address', r.results[i].vicinity)
        row.attr('data-lat', r.results[i].geometry.location.lat);
        row.attr('data-lng', r.results[i].geometry.location.lng);

        row.addClass('rec');
        $('#recommendations').append(row);
        let bound = new google.maps.LatLng(r.results[i].geometry.location.lat, r.results[i].geometry.location.lng);
        app.addRecommendedMarker(r.results[i].geometry.location.lat, r.results[i].geometry.location.lng, r.results[i].name);
      }
      // app.centerMap();
    }
    );
  },

  addRecommendedMarker: function(lat, lng, name) {
    var marker = new google.maps.Marker({
      position: {lat: lat, lng: lng},
      map: map,
      title: name,
      icon: 'http://clikcloud.com/wp-content/uploads/2012/03/check1.png'
    });
    recommendedMarkers.push(marker);
    let bound = new google.maps.LatLng(lat, lng);
    // bounds.extend(bound);
  },

  clearRecommendedMarkers: function() {
    for (let i = 0; i < recommendedMarkers.length; i++){
        recommendedMarkers[i].setMap(null);
    }
    recommendedMarkers = [];
  },

  getCurrentWeather: function(lat, lng) {
    let client_id = 'NsPuRu3InFgIvvtiBFlOY';
    let client_secret = 'z2ZzlPeWZ3UeARqpU89f1mFpbr0qUoWbW5PbzTcI';
    let url = 'https://api.aerisapi.com/observations/summary/closest?client_id=' + client_id + '&client_secret=' + client_secret + '&p=' + lat + ',' + lng;
    console.log(url);
    $.ajax({
      url: url,
      method: 'GET'
    }). then(function(response) {
      console.log(response.response[0].periods[0].summary.weather.phrase);
      $('#weather').css('display', 'block');
      $('#weatherphrase').text(response.response[0].periods[0].summary.weather.phrase);
      $('#htemperature').text(response.response[0].periods[0].summary.temp.maxF);
      $('#ltemperature').text(response.response[0].periods[0].summary.temp.minF);
    })
  }
}

//END APP

//Initialize Google map

function initMap(startLat, startLong, address) {
        console.log('map initted');
        var myLatLng = new google.maps.LatLng(startLat, startLong);

        map = new google.maps.Map(document.getElementById('map-display'), {
          zoom: 13,
          center: myLatLng
        });
        bounds = new google.maps.LatLngBounds();
        app.selectStop(startLat, startLong, 'Start', address);
}

//DOM Listeners

$(document).on('click', '#form-submit', function(event) {
  event.preventDefault();
  app.start();
});

$(document).on('click', '.rec', function(event) {
  let lat = $(this).attr('data-lat');
  let lng = $(this).attr('data-lng');
  let name = $(this).attr('data-name');
  let address = $(this).attr('data-address');
  let latlng = new google.maps.LatLng(lat, lng);
  app.recommendPlaces(lat, lng);
  app.selectStop(lat, lng, name, address);
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
