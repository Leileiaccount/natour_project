/*eslint-disable*/
console.log('mapBox is working!!');

const locations = document.getElementById('map').dataset.locations;
console.log(JSON.parse(locations));

var map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 13
});