->Sidebar
  ->Logo
  ->Route Search
    ->From
    ->To
    ->Search
    ->Search results
      ->Route (Old&New)
      ->Selected route info
  ->Route groups
    ->Routes
      ->Route
        ->Type icon
        ->Route Nr
        ->Selected route info
->Map
  ->Marker for route groups
  ->Selected route
    ->Selected route end and start marker
    ->Stop markers
    ->Route line


Search endpoints:

http://matka.hsl.fi/otp/otp/routers/default/geocode?query=Roomankatu

http://matka.hsl.fi/otp/routers/default/plan?fromPlace=stop+Helsinginkatu+(0250)%3A%3A60.186956%2C24.952375&toPlace=corner+path+%26+Roomankatu+%3A%3A60.2018897%2C24.967974&time=10%3A17am&date=2015-04-10&mode=TRANSIT%2CWALK&maxWalkDistance=804.672&arriveBy=false&wheelchair=false&showIntermediateStops=false&locale=en

fromPlace:stop Helsinginkatu (0250)::60.186956,24.952375
toPlace:corner path & Roomankatu ::60.2018897,24.967974
time:10:17am
date:2015-04-10
mode:TRANSIT,WALK
maxWalkDistance:804.672
arriveBy:false
wheelchair:false
showIntermediateStops:false
locale:en
