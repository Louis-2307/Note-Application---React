import React, {useEffect, useState} from 'react';
import { View,ActivityIndicator, FlatList, Text, Button, TextInput, Alert, Image} from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { FloatingAction } from "react-native-floating-action";
import { Platform } from 'react-native';
import * as SMS from 'expo-sms';
import * as MailComposer from 'expo-mail-composer'
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';

import { styles } from './styles/styles';
import ContentOfList from './components/ContentOfList';
import CustomHeaderButton from './components/CustomHeaderButton';
import ImageSelector from './components/ImageSelector';
import { db, firestore, auth  } from './FirebaseConfig'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, push, getDatabase , onValue, set} from "firebase/database"


function LoginScreen() {
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [databaseData, setDatabaseData] = useState('');
  const auth = getAuth()
  const navigation = useNavigation()

 const registerWithFirebase = () => {
    if (registrationEmail.length < 4) {
      Alert.alert('Please enter an email address.');
      return;
    }

    if (registrationPassword.length < 4) {
      Alert.alert('Please enter a password.');
      return;
    }
    
    createUserWithEmailAndPassword(auth,registrationEmail, registrationPassword)
      .then((userCredential) => {
        Alert.alert('user registered!');

        setRegistrationEmail('');
        setRegistrationPassword('');
      })
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode == 'auth/weak-password') {
          Alert.alert('The password is too weak.');
        }
        else {
          Alert.alert(errorMessage);
        }
        console.log(error);
      }
      );
  }

  const loginWithFirebase = () => {
    if (loginEmail.length < 4) {
      Alert.alert('Please enter an email address.');
      return;
    }

    if (loginPassword.length < 4) {
      Alert.alert('Please enter a password.');
      return;
    }
    const moveToNextScreen = () => {navigation.navigate("FirstScreen")}
    
    signInWithEmailAndPassword(auth ,loginEmail, loginPassword)
      .then(function (_firebaseUser) {
       if(_firebaseUser)
       {
        Alert.alert('user logged in!');
        setLoggedIn(true);
        playAudio()
        moveToNextScreen()
       }
        // load data
        //retrieveDataFromFirebase();
      })
      
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode === 'auth/wrong-password') {
          Alert.alert('Wrong password.');
        }
        else {
          Alert.alert(errorMessage);
        }
      }
    );
  }

const playAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    let soundObject = null
    soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(require('./assets/sounds/audio.mp3'));
      await soundObject.setStatusAsync({ isLooping: false });
      await soundObject.playAsync();
      console.log('we are playing')
    } catch (error) {
      console.log('An error occurred');
      console.log(error);
    }
  };

  return (
    <View style={styles.form1}>
          <View style={styles.View1}>
            <Text style={styles.label}>Register with Firebase</Text>
            <TextInput
              style={styles.textInput}
              onChangeText={ (value) => setRegistrationEmail(value) }
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="email"
              keyboardType="email-address"
              placeholder="email"
            />
            <TextInput
              style={styles.textInput}
              onChangeText={ (value) => setRegistrationPassword(value) }
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="password"
              keyboardType="visible-password"
              placeholder="password"
            />
            <Button style={styles.button} title="Register" onPress={registerWithFirebase} />
          </View>
          <View>
            <Text style={styles.label}>Sign In with Firebase</Text>
            <TextInput
              style={styles.textInput}
              onChangeText={ (value) => setLoginEmail(value) }
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="email"
              keyboardType="email-address"
              placeholder="email"
            />
            <TextInput
              style={styles.textInput}
              onChangeText={ (value) => setLoginPassword(value) }
              autoCapitalize="none"
              autoCorrect={false}
              autoCompleteType="password"
              keyboardType="visible-password"
              placeholder="password"
            />
            <Button style={styles.button} title="Login" onPress={loginWithFirebase} />
          </View>
       </View>   
  )
}


function FirstScreen() 
{
  const navigation = useNavigation()
  const route = useRoute();
  const [dataFromDatabase, setDataFromDatabase] = useState([]);

  //console.log(dataFromDatabase)
  useEffect(() => {
    const isObjectEmpty = Object.keys(dataFromDatabase).length === 0;
      if(isObjectEmpty)
      {retrieveDataFromFirebase()}
  },[]);

  function saveDataWithFirebase(Key, Title, Note, Image, Location) {
    const userId = auth.currentUser.uid;
    push(ref(db,`users/` + userId),
    {
      Key: Key, 
      Title: Title,
      Note: Note, 
      Image: Image,
      Location: Location
    }).then(function () {
      Alert.alert('Document successfully written!');
    })
    .catch(function (error) {
      Alert.alert('Error writing document');
      console.log('Error writing document: ', error);
    });
    retrieveDataFromFirebase()
  }

  function retrieveDataFromFirebase() {
    const userId = auth.currentUser.uid;
    const dataFirebase = ref(db, 'users/' + userId)
    setDataFromDatabase('')
   try {
    onValue(dataFirebase, (snapshot) => {
      snapshot.forEach((item) => {
      //console.log(item.val().Title)
        setDataFromDatabase((prev) => [...prev , {Key: item.val().Key, Title: item.val().Title, Note: item.val().Note, Image: item.val().Image, Location: item.val().Location}])
      })
     // console.log(dataFromDatabase)
    })
   }catch(error) 
    {
     console.log("Error getting document:", error);
    }
  }

  function updateDataFromFirebase(Key, Title, Note, Image, Location){
    const userId = auth.currentUser.uid;
    const dataFirebase = ref(db, 'users/' + userId)
    var keyID
    const postData = {
      Key: Key,
      Title: Title,
      Note: Note,
      Image: Image,
      Location: Location,
    }
   try{
    onValue(dataFirebase, (snapshot) => {
      snapshot.forEach((item) => {
          if(item.val().Key == Key)
          {
            keyID = item.key
            //console.log(keyID)
          }
      })
    })  
      set(ref(db,'/users/' + userId + '/' + keyID), postData)
    }catch(error){
      console.log("Update Error: ", error);
    }
    retrieveDataFromFirebase()
  }
  
  const onNewNoteSaved = (noteItem) => {  
    saveDataWithFirebase(noteItem.Key,noteItem.Title, noteItem.Note, noteItem.Image, noteItem.Location)
  };

   function searchTitle(itemId)
   {
     var arrayObject = dataFromDatabase.filter(item => item.Key == itemId)
     return arrayObject[0].Title
   }

   function searchNote(itemId)
   {
     var arrayObject = dataFromDatabase.filter(item => item.Key == itemId)
     return arrayObject[0].Note
   }
   function searchImage(itemId)
   {
     var arrayObject = dataFromDatabase.filter(item => item.Key == itemId)
     return arrayObject[0].Image
   }
   function searchLocation(itemId)
   {
     var arrayObject = dataFromDatabase.filter(item => item.Key == itemId)
     return arrayObject[0].Location
   }
  const transferDataToThirdScreen = (itemId) => {
  
    navigation.navigate('ThirdScreen',{
      Title1: searchTitle(itemId),
      Note1: searchNote(itemId),
      Image1: searchImage(itemId),
      Location1: searchLocation(itemId),
      Key1: itemId
    })
  }
  
  navigation.addListener('focus', () => {
    if(route.params.Title2)
    {
      var newTitle = route.params.Title2
      var newNote = route.params.Note2
      var newImage = route.params.Image2
      var newKey = route.params.Key2
      var newLocation = route.params.Location2
      updateDataFromFirebase( newKey, newTitle, newNote, newImage, newLocation)   
    }
});

const auth = getAuth()
const signoutWithFirebase = () => {
  signOut(auth).then(() => {
    // if logout was successful
    if (!auth.currentUser) {
      Alert.alert('user was logged out!');
      //setLoggedIn(false);  
    }
  }).then(() => {navigation.navigate('LoginScreen')})
}
    return (
        <View style={styles.form}>
          <FlatList
            data={dataFromDatabase}
            renderItem={itemData => (
                <ContentOfList id={itemData.item.Key} onPress={transferDataToThirdScreen} item={itemData.item.Title} />)} 
                />
          <FloatingAction
            style={styles.floatinBtn}
            onPressMain={() => navigation.navigate('SecondScreen' ,{onSee: onNewNoteSaved })} />
          <Button style={styles.signOutButton} title="Sign Out" onPress={signoutWithFirebase} />
        </View>
    );
}


function SecondScreen () 
{
  const navigation = useNavigation();
  const route = useRoute(); 
  const [enteredTitle, setTitle] = useState('');
  const [enteredNote, setNote] = useState('');
  const [selectedImage, setSelectedImage] = useState();
  const [currentLocation, setCurrentLocation] = useState();
  const [isFetching, setIsFetching] = useState();
  
    const TitleItemInputHandler = (value) => { 
      setTitle(value);
    }
    const NoteItemInputHandler = (value1) => {
        setNote(value1);
    }

    const addItemHandler = () => {
      route.params.onSee({Key: Math.random(), Title: enteredTitle, Note: enteredNote, Image: selectedImage, Location: currentLocation })
      navigation.goBack();
        setTitle('');
        setNote(''); 
    }

      const imageSelectedHandler = imagePath => {
          setSelectedImage(imagePath);
      }
   
    const  hasLocationPermissions = async () => {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location services are not enabled! You need to enable them to use this app!')
          return false;
        }
        return true;
      }
    
     const getCurrentLocation = async () => {
        setIsFetching(true);
    
        if(await hasLocationPermissions()) {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          var lat = JSON.stringify(location.coords.latitude)
          var lon = JSON.stringify(location.coords.longitude)
          setCurrentLocation(`latitude: ${lat}, longitude: ${lon}`);
          console.log(currentLocation)
          
        }
    
        setIsFetching(false);
      }
      

    return (
         <View style={styles.form3}>
            <Text style={styles.labelsecond}>TITLE</Text>
            <TextInput placeholder="Item" style={styles.inputsecond1} onChangeText={TitleItemInputHandler} value={enteredTitle} />
            <Text style={styles.labelsecond}>IMAGE</Text>
               <View>
                { !selectedImage && 
                    <ImageSelector onImageSelected={imageSelectedHandler} /> 
                }
                { selectedImage && 
                    <View>
                        <Image style={styles.image1} source={{ uri: selectedImage }} />
                        <Button title="Reset" onPress={() => { setSelectedImage(null); }} />
                    </View>
                }
              </View>
            <Text style={styles.labelsecond}>CURRENT LOCATION</Text>
             { isFetching ? 
              <ActivityIndicator size="large" color="#0000ff" /> : 
              <Text style={styles.json}>{JSON.stringify(currentLocation, null, 2)}</Text>
             }
           <Button style={styles.button}  title="Get Current Location" onPress={getCurrentLocation} />
            <Text style={styles.labelsecond}>NOTE</Text>
            <TextInput placeholder="Item" style={styles.inputsecond2} onChangeText={NoteItemInputHandler} value={enteredNote}/>
          <Button style={styles.buttonsecond} title="SAVE" onPress={ addItemHandler}/>
            </View>
    
    );
}

SecondScreen.navigationOptions = {
    headerTitle: 'Add Place'
}


function ThirdScreen() 
{
  const navigation = useNavigation();
  const route = useRoute(); 
  const [UpdateTitle, setUpdateTitle] = useState(route.params.Title1);
  const [UpdateNote, setUpdateNote] = useState(route.params.Note1);
  const [UpdateImage, setUpdateImage] = useState(route.params.Image1);
  const [currentLocation, setCurrentLocation] = useState(route.params.Location1);
  const [isFetching, setIsFetching] = useState();
 //console.log(route.params.Title1)


  const TitleItemUpdateHandler =(value) => {
    setUpdateTitle(value)
  }
  const NoteItemUpdateHandler = (value) => {
    setUpdateNote(value)
  }
  const ImageItemUpdateHandler = (value) => {
    setUpdateImage(value)
  }
  const getCurrentLocation = async () => {
    setIsFetching(true);
      
    let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
    var lat = JSON.stringify(location.coords.latitude)
    var lon = JSON.stringify(location.coords.longitude)
    setCurrentLocation(`latitude: ${lat}, longitude: ${lon}`);
    setIsFetching(false);
  }
  const updateItemHandler = () => {
      //updateCurrentValue()
      navigation.navigate('FirstScreen',{
        Title2: UpdateTitle,
        Note2: UpdateNote,
        Image2: UpdateImage,
        Location2: currentLocation,
        Key2: route.params.Key1
      })
      setUpdateTitle('');
      setUpdateNote('');
  }
  const promptForQuestionResponse = () => {
    Alert.alert(
      'Note Saved',
      'Your note has been saved/updated!',
      {
        text: 'Okay',
        onPress: () => navigation.navigate('FirstScreen')
      },
      {cancelable: false},
    );

    updateItemHandler()
  }
  
  const sendMessageWithSMS = async () => {
    const isAvailable = await SMS.isAvailableAsync(); 
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync( 
        ['111111111', '2222222222'],
        `${UpdateNote} && ${currentLocation}`
      );
      console.log(result); 
    } else {
      console.log("SMS is not available on this device");
    }
  }

  const sendMessageWithEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();

    if(isAvailable) {
      var options = { 
        recipients: ['louis.le.2307@gmail.com'],
        subject: UpdateTitle,
        body:  `${UpdateNote} && ${currentLocation}`  
      };

      MailComposer.composeAsync(options).then((result) => { console.log(result.status); }); 
    } else {
      console.log("Email is not available on this device");
    }
  }

return (

        <View style={styles.form3}>
          <View style={styles.Emailbutton}>
             <Button  title="SMS"  onPress={sendMessageWithSMS} />
             <Button  title="Email"  onPress={sendMessageWithEmail} />
          </View>

        <Text style={styles.labelsecond}>TITLE</Text>
        <TextInput placeholder="Title" style={styles.inputsecond1} onChangeText={TitleItemUpdateHandler} value = {UpdateTitle} />
        <Text style={styles.labelsecond}>IMAGE</Text>
                { !UpdateImage && 
                    <ImageSelector onImageSelected={ImageItemUpdateHandler} /> 
                }
                { UpdateImage && 
                    <View>
                        <Image style={styles.image1} source={{ uri: UpdateImage }} />
                        <Button title="Reset" onPress={() => { setUpdateImage(null); }} />
                    </View>
                }
        <Text style={styles.labelsecond}>CURRENT LOCATION</Text>
             { isFetching ? 
              <ActivityIndicator size="large" color="#0000ff" /> : 
              <Text style={styles.json}>{JSON.stringify(currentLocation, null, 2)}</Text>
             }
           <Button style={styles.button}  title="Change Current Location" onPress={getCurrentLocation} />         
        <Text style={styles.labelsecond}>NOTE</Text>
        <TextInput placeholder="Note" style={styles.inputsecond2} onChangeText={NoteItemUpdateHandler} value = {UpdateNote}/>
        <Button style={styles.buttonsecond} title="UPDATE" onPress={()=> promptForQuestionResponse()} />
        </View>
    
);

}



const Stack = createStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
    <Stack.Navigator
                screenOptions={{
                    headerTintColor: Platform.OS === 'android' ? 'white' : 'blue',
                    headerStyle: {
                        backgroundColor: Platform.OS === 'android' ? 'green' : ''
                    }
                }}
    >
         <Stack.Screen 
            name="LoginScreen" 
            component={LoginScreen}
            options={{
                        title: 'Notes! a_le17869' ,
                        headerTitleAlign: 'center',
                    }}/>
        <Stack.Screen 
            name="FirstScreen" 
            component={FirstScreen}
            initialParams={{ Title2: '' , Note2: '' , Key2: '', Image2:'', Location2:''}} 
            options={{
                        title: 'Notes! List' ,
                        headerTitleAlign: 'center',
                    }}/>
         <Stack.Screen 
            name="SecondScreen" 
            component={SecondScreen} 
            options={{
                        title: 'Note Input',
                        headerTitleAlign: 'center'
                    }} />
        <Stack.Screen 
            name="ThirdScreen" 
            component={ThirdScreen}
            initialParams={{ Title1: '' , Note1: '' }}
            options={{
                      title: 'Note Input',
                      headerTitleAlign: 'center',
                  }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
