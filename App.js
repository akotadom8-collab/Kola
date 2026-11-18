updated kolaride app.jsimport React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase } from './src/supabase';

const C = { ink:'#14251F', green:'#176B4D', mint:'#E7F4EC', lime:'#C9F36A',
  paper:'#F6F8F5', white:'#FFFFFF', muted:'#718078', line:'#E3EAE5',
  orange:'#F4A340', red:'#D84B4B' };
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
const seedTrips = [
  {id:'KR-1042',from:'Surry Hills, NSW',to:'Sydney Airport',date:'Today · 9:30 am',status:'Completed',fare:38.50},
  {id:'KR-1043',from:'Newtown, NSW',to:'Circular Quay',date:'Today · 11:15 am',status:'Scheduled',fare:24.80}
];

function Button({title,onPress,kind='primary',small=false}) {
  return <TouchableOpacity onPress={onPress} style={[styles.button,kind==='light'&&styles.buttonLight,kind==='outline'&&styles.buttonOutline,small&&{paddingVertical:9}]}>
    <Text style={[styles.buttonText,kind!=='primary'&&styles.buttonTextDark,{fontSize:small?12:14}]}>{title}</Text>
  </TouchableOpacity>;
}
function Field({label,value,onChangeText,placeholder,keyboardType}) {
  return <View style={{marginBottom:12}}>
    <Text style={styles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType||'default'} placeholderTextColor="#9AA69F" style={styles.input}/>
  </View>;
}
function Header({eyebrow,title,right}) {
  return <View style={styles.header}><View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.heading}>{title}</Text></View>{right}</View>;
}
function Pill({children,active}) { return <View style={[styles.pill,active&&{backgroundColor:C.mint}]}><Text style={{fontSize:11,fontWeight:'700',color:active?C.green:C.muted}}>{children}</Text></View>; }

export default function App() {
  const [tab,setTab] = useState('Ride');
  const [role,setRole] = useState('Passenger');
  const [pickup,setPickup] = useState('Current location');
  const [destination,setDestination] = useState('');
  const [promo,setPromo] = useState('');
  const [scheduled,setScheduled] = useState(false);
  const [when,setWhen] = useState('Today, 5:30 pm');
  const [location,setLocation] = useState(null);
  const [tracking,setTracking] = useState(false);
  const [trips,setTrips] = useState(seedTrips);
  const [drivers,setDrivers] = useState([
    {id:'D-001',name:'Alex Morgan',car:'Toyota Corolla · ABC 123',status:'Available',earned:286.40},
    {id:'D-002',name:'Sam Lee',car:'Hyundai i30 · XYZ 908',status:'On trip',earned:194.20}
  ]);
  const [fare,setFare] = useState(26.40);
  const [rideType,setRideType] = useState('Everyday');
  const [couponApplied,setCouponApplied] = useState(false);
  const [driverOnline,setDriverOnline] = useState(false);
  const [earnings,setEarnings] = useState(286.40);
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await Location.requestForegroundPermissionsAsync();
        if (p.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({latitude:loc.coords.latitude,longitude:loc.coords.longitude});
        }
      } catch(e) {}
    })();
  }, []);

  useEffect(() => {
    if (!tracking || !supabase) return;
    const channel = supabase.channel('trip-live-demo')
      .on('broadcast',{event:'driver-location'},({payload})=>setLocation(payload))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tracking]);

  const finalFare = couponApplied ? fare * 0.9 : fare;
  const estimate = useMemo(() => {
    const base = rideType==='XL' ? 8.5 : rideType==='Comfort' ? 6.5 : 4.2;
    const km = destination.trim() ? 12 : 8;
    return Math.round((base + km*1.65 + 4.5)*100)/100;
  },[destination,rideType]);

  const bookRide = () => {
    if (!destination.trim()) return Alert.alert('Add a destination','Enter where you want to go.');
    const t = {id:'KR-'+(1044+trips.length),from:pickup,to:destination,date:scheduled?when:'Now',status:scheduled?'Scheduled':'Finding driver',fare:couponApplied?estimate*.9:estimate};
    setTrips([t,...trips]); setFare(t.fare); setTab('Trips');
    Alert.alert('Ride request created', scheduled?'Your scheduled ride has been saved.':'We are looking for a nearby driver. This demo does not dispatch real drivers.');
  };
  const applyPromo = () => {
    if (promo.trim().toUpperCase()==='KOALA10') { setCouponApplied(true); Alert.alert('Promo applied','10% off your estimated fare.'); }
    else Alert.alert('Code not recognised','Try the demo code KOALA10.');
  };
  const goOnline = async () => {
    if (!driverOnline) {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status!=='granted') return Alert.alert('Location needed','Allow location access to go online.');
    }
    setDriverOnline(!driverOnline);
  };

  const passenger = () => <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <View style={styles.brandRow}><View style={styles.logo}><Text style={{fontSize:22}}>🐨</Text></View><View><Text style={styles.brand}>koala<Text style={{color:C.lime}}>ride</Text></Text><Text style={styles.tagline}>A better way to get there</Text></View><View style={{flex:1}}/><Pill active>SYDNEY DEMO</Pill></View>
      <Text style={styles.heroTitle}>Where to{"\n"}next?</Text>
      <Text style={styles.heroSub}>Reliable rides, right around the corner.</Text>
      <View style={styles.bookingCard}>
        <Field label="PICK-UP" value={pickup} onChangeText={setPickup}/>
        <View style={styles.dotted}/>
        <Field label="YOUR DESTINATION" value={destination} onChangeText={setDestination} placeholder="Enter destination"/>
        <Text style={styles.label}>CHOOSE YOUR RIDE</Text>
        <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
          {['Everyday','Comfort','XL'].map(x=><TouchableOpacity key={x} onPress={()=>setRideType(x)} style={[styles.rideChoice,rideType===x&&styles.rideChoiceActive]}><Text style={{fontWeight:'700',color:rideType===x?C.green:C.ink}}>{x}</Text><Text style={{fontSize:11,color:C.muted}}>{x==='XL'?'6 seats':x==='Comfort'?'Premium':'4 seats'}</Text></TouchableOpacity>)}
        </View>
        <View style={styles.rowBetween}><Text style={styles.label}>ESTIMATED FARE</Text><Text style={styles.price}>{money(couponApplied?estimate*.9:estimate)}</Text></View>
        <View style={{flexDirection:'row',gap:8,alignItems:'center',marginTop:8}}>
          <View style={{flex:1}}><TextInput value={promo} onChangeText={setPromo} placeholder="Promo code (KOALA10)" autoCapitalize="characters" style={styles.input}/></View>
          <Button title="Apply" kind="light" small onPress={applyPromo}/>
        </View>
        <TouchableOpacity onPress={()=>setScheduled(!scheduled)} style={styles.scheduleRow}><Text style={{fontSize:17}}>🗓️</Text><Text style={{fontWeight:'700',color:C.ink,flex:1}}>Schedule this ride</Text><Text style={{color:C.green,fontWeight:'800'}}>{scheduled?'ON':'OFF'}</Text></TouchableOpacity>
        {scheduled&&<Field label="PICK-UP DATE & TIME" value={when} onChangeText={setWhen} placeholder="e.g. Tomorrow, 8:00 am"/>}
        <Button title={scheduled?'Schedule ride':'Find a ride'} onPress={bookRide}/>
      </View>
    </View>
    <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>Your city, connected</Text><Text style={styles.muted}>Simple, transparent and local.</Text></View>
    <View style={styles.featureRow}><Text style={styles.featureIcon}>🛡️</Text><View style={{flex:1}}><Text style={styles.featureTitle}>Safety comes first</Text><Text style={styles.muted}>Trip details and driver information in one place.</Text></View></View>
    <View style={styles.featureRow}><Text style={styles.featureIcon}>💳</Text><View style={{flex:1}}><Text style={styles.featureTitle}>Cashless convenience</Text><Text style={styles.muted}>Secure payment integration is ready for setup.</Text></View></View>
  </ScrollView>;

  const driver = () => <ScrollView contentContainerStyle={styles.content}>
    <Header eyebrow="DRIVER CENTRE" title="Your dashboard" right={<Pill active>{driverOnline?'ONLINE':'OFFLINE'}</Pill>}/>
    <View style={styles.earnCard}><Text style={{color:'#D5E8DE'}}>YOUR EARNINGS · THIS WEEK</Text><Text style={styles.earnAmount}>{money(earnings)}</Text><Text style={{color:'#D5E8DE'}}>Demo earnings · 12 completed trips</Text><View style={{marginTop:18}}><Button title={driverOnline?'Go offline':'Go online'} kind="light" onPress={goOnline}/></View></View>
    <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statNum}>4.92 ★</Text><Text style={styles.muted}>Rating</Text></View><View style={styles.stat}><Text style={styles.statNum}>12</Text><Text style={styles.muted}>Trips</Text></View><View style={styles.stat}><Text style={styles.statNum}>94%</Text><Text style={styles.muted}>Acceptance</Text></View></View>
    <Text style={styles.sectionHeading}>Trip opportunities</Text>
    <View style={styles.listCard}><View style={{flex:1}}><Text style={styles.featureTitle}>Central Station → Bondi</Text><Text style={styles.muted}>Approx. 22 min · 8.4 km</Text></View><Text style={styles.price}>{money(24.60)}</Text><Button small title="Accept" onPress={()=>{setEarnings(v=>v+24.6);Alert.alert('Trip accepted','Demo trip added to earnings.')}}/></View>
    <View style={styles.listCard}><View style={{flex:1}}><Text style={styles.featureTitle}>Newtown → Barangaroo</Text><Text style={styles.muted}>Approx. 18 min · 6.2 km</Text></View><Text style={styles.price}>{money(19.80)}</Text><Button small title="Accept" onPress={()=>{setEarnings(v=>v+19.8);Alert.alert('Trip accepted','Demo trip added to earnings.')}}/></View>
    <Text style={styles.note}>Driver onboarding, identity checks, right-to-work checks, vehicle documents and insurance verification must be completed before real trips can be enabled.</Text>
  </ScrollView>;

  const tripScreen = () => <ScrollView contentContainerStyle={styles.content}>
    <Header eyebrow="YOUR ACTIVITY" title="Trips & tracking"/>
    <View style={styles.mapWrap}>
      {location?<MapView style={{flex:1}} initialRegion={{...location,latitudeDelta:.08,longitudeDelta:.08}} showsUserLocation><Marker coordinate={location} title="Your location"/></MapView>:<View style={styles.mapFallback}><Text style={{fontSize:32}}>📍</Text><Text style={styles.featureTitle}>Map preview</Text><Text style={styles.muted}>Enable location access to show your position.</Text></View>}
    </View>
    <Button title={tracking?'Stop live tracking':'Start live tracking demo'} onPress={()=>setTracking(!tracking)} kind={tracking?'outline':'primary'}/>
    <Text style={styles.sectionHeading}>Recent bookings</Text>
    {trips.map(t=><View key={t.id} style={styles.tripCard}><View style={styles.rowBetween}><Text style={styles.featureTitle}>{t.id}</Text><Pill active>{t.status}</Pill></View><Text style={styles.tripRoute}>{t.from}  →  {t.to}</Text><View style={styles.rowBetween}><Text style={styles.muted}>{t.date}</Text><Text style={styles.price}>{money(t.fare)}</Text></View></View>)}
  </ScrollView>;

  const admin = () => <ScrollView contentContainerStyle={styles.content}>
    <Header eyebrow="OPERATIONS" title="Admin overview" right={<Pill active>DEMO DATA</Pill>}/>
    <View style={styles.adminGrid}>
      <View style={styles.adminMetric}><Text style={styles.muted}>Gross bookings</Text><Text style={styles.metricValue}>{money(2846.50)}</Text><Text style={styles.positive}>↑ 8.4% this week</Text></View>
      <View style={styles.adminMetric}><Text style={styles.muted}>Platform commission</Text><Text style={styles.metricValue}>{money(426.98)}</Text><Text style={styles.muted}>15% demo rate</Text></View>
      <View style={styles.adminMetric}><Text style={styles.muted}>Active drivers</Text><Text style={styles.metricValue}>24</Text><Text style={styles.muted}>2 on trips</Text></View>
      <View style={styles.adminMetric}><Text style={styles.muted}>Completed trips</Text><Text style={styles.metricValue}>186</Text><Text style={styles.muted}>This week</Text></View>
    </View>
    <Text style={styles.sectionHeading}>Driver management</Text>
    {drivers.map(d=><View key={d.id} style={styles.listCard}><View style={{flex:1}}><Text style={styles.featureTitle}>{d.name}</Text><Text style={styles.muted}>{d.car}</Text><Text style={{fontSize:11,color:C.green,marginTop:4}}>{d.status} · {money(d.earned)} earned</Text></View><Button title="Review" kind="outline" small onPress={()=>Alert.alert(d.name,'Demo driver record. Connect the secured admin backend to review uploaded documents.')}/></View>)}
    <Text style={styles.note}>Production admin access must use authenticated roles and server-side permissions. Never expose admin controls to public app users.</Text>
  </ScrollView>;

  const screens = {Ride:passenger,Driver:driver,Trips:tripScreen,Admin:admin};
  return <SafeAreaView style={styles.safe}>
    <ExpoStatusBar style="dark"/>
    <View style={styles.topbar}>
      <View style={styles.brandMark}><Text style={{fontSize:18}}>🐨</Text></View>
      <Text style={styles.topBrand}>koalaride</Text>
      <View style={{flex:1}}/>
      <TouchableOpacity onPress={()=>setRole(role==='Passenger'?'Driver':'Passenger')} style={styles.roleSwitch}><Text style={styles.roleText}>{role} ▾</Text></TouchableOpacity>
    </View>
    {screens[tab]()}
    <View style={styles.nav}>
      {[['Ride','⌂'],['Driver','◉'],['Trips','▤'],['Admin','▦']].map(([name,ico])=><TouchableOpacity key={name} onPress={()=>setTab(name)} style={styles.navItem}><Text style={{fontSize:20,color:tab===name?C.green:C.muted}}>{ico}</Text><Text style={[styles.navText,tab===name&&{color:C.green,fontWeight:'800'}]}>{name}</Text></TouchableOpacity>)}
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.paper,paddingTop:Platform.OS==='android'?StatusBar.currentHeight:0},
 topbar:{height:58,backgroundColor:C.white,flexDirection:'row',alignItems:'center',paddingHorizontal:20,borderBottomWidth:1,borderColor:C.line},
 brandMark:{width:34,height:34,borderRadius:12,backgroundColor:C.mint,alignItems:'center',justifyContent:'center'},
 topBrand:{fontSize:18,fontWeight:'900',color:C.ink,marginLeft:9,letterSpacing:-.5},
 roleSwitch:{backgroundColor:C.paper,paddingHorizontal:12,paddingVertical:8,borderRadius:20},
 roleText:{fontSize:11,fontWeight:'800',color:C.green},
 content:{padding:20,paddingBottom:34},
 hero:{backgroundColor:C.green,margin:-20,marginBottom:20,padding:20,paddingTop:22,borderBottomLeftRadius:28,borderBottomRightRadius:28},
 brandRow:{flexDirection:'row',alignItems:'center'},
 logo:{width:42,height:42,borderRadius:14,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center',marginRight:10},
 brand:{fontSize:21,fontWeight:'900',color:C.white,letterSpacing:-1},
 tagline:{fontSize:10,color:'#D5E8DE'},
 eyebrow:{fontSize:10,letterSpacing:1.4,fontWeight:'800',color:C.green,marginBottom:5},
 heading:{fontSize:27,fontWeight:'900',color:C.ink,letterSpacing:-.8},
 heroTitle:{fontSize:39,fontWeight:'900',color:C.white,letterSpacing:-1.6,marginTop:24,lineHeight:42},
 heroSub:{fontSize:13,color:'#D5E8DE',marginTop:8,marginBottom:20},
 bookingCard:{backgroundColor:C.white,borderRadius:20,padding:16},
 label:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:C.muted,marginBottom:7},
 input:{height:43,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,borderRadius:10,paddingHorizontal:12,color:C.ink,fontSize:13},
 dotted:{height:1,borderTopWidth:1,borderColor:C.line,borderStyle:'dashed',marginVertical:3},
 rideChoice:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:11,padding:10,alignItems:'center',gap:4},
 rideChoiceActive:{borderColor:C.green,backgroundColor:C.mint},
 rowBetween:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 price:{fontSize:18,fontWeight:'900',color:C.green},
 button:{backgroundColor:C.green,paddingVertical:14,paddingHorizontal:16,borderRadius:12,alignItems:'center',justifyContent:'center'},
 buttonLight:{backgroundColor:C.mint},buttonOutline:{backgroundColor:C.white,borderWidth:1,borderColor:C.green},
 buttonText:{color:C.white,fontWeight:'900'},buttonTextDark:{color:C.green},
 scheduleRow:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:14,marginTop:5},
 sectionTitle:{marginTop:5,marginBottom:15},sectionHeading:{fontSize:18,fontWeight:'900',color:C.ink,marginTop:17,marginBottom:12,letterSpacing:-.3},
 muted:{fontSize:11,color:C.muted,lineHeight:17},featureRow:{flexDirection:'row',alignItems:'center',gap:13,backgroundColor:C.white,borderRadius:14,padding:15,marginBottom:9},
 featureIcon:{fontSize:23},featureTitle:{fontSize:13,fontWeight:'800',color:C.ink,marginBottom:3},
 pill:{paddingHorizontal:9,paddingVertical:6,backgroundColor:C.paper,borderRadius:20},
 earnCard:{backgroundColor:C.green,borderRadius:20,padding:20,marginTop:20},
 earnAmount:{fontSize:36,fontWeight:'900',color:C.white,marginVertical:8,letterSpacing:-1},
 statsRow:{flexDirection:'row',gap:9,marginVertical:16},
 stat:{flex:1,backgroundColor:C.white,borderRadius:14,padding:14},
 statNum:{fontSize:17,fontWeight:'900',color:C.ink,marginBottom:4},
 listCard:{backgroundColor:C.white,borderRadius:14,padding:14,marginBottom:9,flexDirection:'row',alignItems:'center',gap:10},
 note:{fontSize:11,color:C.muted,lineHeight:17,backgroundColor:'#EEF2EF',padding:13,borderRadius:12,marginTop:14},
 mapWrap:{height:220,borderRadius:18,overflow:'hidden',marginTop:18,marginBottom:12,backgroundColor:C.mint},
 mapFallback:{flex:1,alignItems:'center',justifyContent:'center',gap:7},
 tripCard:{backgroundColor:C.white,borderRadius:14,padding:15,marginBottom:10},
 tripRoute:{fontSize:12,color:C.ink,marginVertical:12},
 adminGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:18},
 adminMetric:{width:'48%',backgroundColor:C.white,borderRadius:15,padding:14},
 metricValue:{fontSize:22,fontWeight:'900',color:C.ink,marginVertical:7},
 positive:{fontSize:10,fontWeight:'800',color:C.green},
 nav:{height:66,backgroundColor:C.white,borderTopWidth:1,borderColor:C.line,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
 navItem:{alignItems:'center',gap:2,flex:1},navText:{fontSize:10,color:C.muted,fontWeight:'600'}
});
