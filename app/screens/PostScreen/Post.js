import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Linking,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    TextInput,
    ProgressBarAndroid
} from "react-native";
import ModalHeader from "../../components/ModalHeaderNavigationBar/modalHeaderNavigationBar";
import styles from "./style";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import HeaderImageScrollView, { TriggeringView } from "react-native-image-header-scroll-view";
import Icon from "react-native-vector-icons/FontAwesome";
import * as Animatable from "react-native-animatable";
import TouchableScale from "react-native-touchable-scale";
import { f, auth, storage, database } from "../../config/firebaseConfig";
import { COLOR_PRIMARY } from "../../config/styles";
import Video from "react-native-video";
import ImagePicker from "react-native-image-picker";
export default class Post extends Component {

    constructor(props) {
        super(props);
        this.state = {
            latitude: null,
            longitude: null,
            region: null,
            showNavTitle: false,
            liked: false,
            post: [],
            loaded: false,
            id: null,
            authorId: f.auth().currentUser.uid,
            control: false,
            proof: false,
            pickedImage: null,
            proofDescription: "",
            progress: 0,
            uploading: false
        }
        this.video = Video;
        this.mapRef = null;
    }
    componentDidMount = async () => {
        var params = this.props.navigation.state.params;
        console.log(params)
        if (params) {

            var that = this;

            var userId = f.auth().currentUser.uid
            database.ref("posts").child(params.id).on("value", (function (snapshot) {
                const exist = (snapshot.val() != null);
                // console.log(exist)
                if (exist) {
                    var data = snapshot.val();
                    var likes = data.likes
                    var count = 0
                    for (var liker in likes) {
                        console.log(liker);
                        if (liker == userId) {
                            that.setState({
                                liked: true
                            })
                            count += 1;
                        }
                    }
                    if (count == 0) {
                        that.setState({
                            liked: false
                        })
                    }
                    console.log(data)
                    const region = {
                        latitude: data.longitude,
                        longitude: data.longitude,
                        latitudeDelta: 0.00922 * 1.5,
                        longitudeDelta: 0.00421 * 1.5
                    }
                    that.setState({
                        region: region,
                        image: data.image,
                        description: data.description,
                        animal: data.animalType,
                        longitude: data.longitude,
                        latitude: data.latitude,
                        loaded: true,
                        userId: data.userId,
                        id: data.id,
                        posted: data.posted,
                        type: data.type,
                        status: data.status

                    })

                    if (data.status == 1) {
                        database.ref("ongoing").child(params.id).child("handlerId").once("value").then(function (snapshot) {
                            const exist = (snapshot.val() != null);
                            if (exist) {
                                hData = snapshot.val();
                                database.ref("users").child(hData).once("value").then(function (snapshot) {
                                    const exsists = (snapshot.val() != null);
                                    if (exsists) {
                                        var data = snapshot.val();
                                        that.setState({
                                            handlerAvatar: data.dp,
                                            handlerName: data.first_name + " " + data.last_name,
                                            handlerId: data.uid

                                        })
                                    }

                                })
                                that.setState({
                                    handlerId: hData,
                                });
                            }
                        }).catch((error) => console.log(error))
                        database.ref("ongoing").child(params.id).child("posted").once("value").then(function (snapshot) {
                            const exist = (snapshot.val() != null);
                            if (exist) {
                                hData = snapshot.val();
                                that.setState({
                                    handlerPosted: hData,
                                });
                            }
                        }).catch((error) => console.log(error))
                    }

                    if (data.status == 2) {
                        database.ref("finshed").child(params.id).once("value").then(function (snapshot) {
                            const exist = (snapshot.val() != null);
                            if (exist) {
                                hData = snapshot.val();
                                database.ref("users").child(hData.handlerId).once("value").then(function (snapshot) {
                                    const exsists = (snapshot.val() != null);
                                    if (exsists) {
                                        var data = snapshot.val();
                                        that.setState({
                                            handlerAvatar: data.dp,
                                            handlerName: data.first_name + " " + data.last_name,
                                            handlerId: data.uid,
                                            handlerPosted: hData.posted,
                                            handlerImages: hData.image,
                                            handlerDescription: hData.description

                                        })
                                    }

                                })
                                that.setState({
                                    handlerId: hData.handlerId,
                                });
                            }
                        }).catch((error) => console.log(error))
                        // database.ref("finshed").child(params.id).child("posted").once("value").then(function (snapshot) {
                        //     const exist = (snapshot.val() != null);
                        //     if (exist) {
                        //         hData = snapshot.val();
                        //         that.setState({
                        //             handlerPosted: hData,
                        //         });
                        //     }
                        // }).catch((error) => console.log(error))
                        // database.ref("finshed").child(params.id).child("image").once("value").then(function (snapshot) {
                        //     const exist = (snapshot.val() != null);
                        //     if (exist) {
                        //         hData = snapshot.val();
                        //         that.setState({
                        //             handlerImages: hData,
                        //         });
                        //     }
                        // }).catch((error) => console.log(error))
                    }
                    //that.mapView.animateToRegion(region, 1000);
                    var postArray = that.state.post
                    database.ref("users").child(data.userId).once("value").then(function (snapshot) {
                        const exsists = (snapshot.val() != null);
                        if (exsists) {
                            var data = snapshot.val();
                            that.setState({
                                avatar: data.dp,
                                name: data.first_name + " " + data.last_name,
                                loaded: true,
                                region: region
                            })
                        }

                    })
                }

                // console.log("inside pot " + that.state.post);

            }), function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }
        console.log("Author ID is " + this.state.authorId)
    }

    clickEventListener() {
        // Alert.alert("Success", "Product has beed added to cart")
        const { navigate } = this.props.navigation;
        navigate("Comment")
    }
    openMap = () => {
        var url = "https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination=" + this.state.latitude + "," + this.state.longitude;
        Linking.canOpenURL(url).then(supported => {
            if (!supported) {
                console.log("Can\"t handle url: " + url);
            } else {
                return Linking.openURL(url);
            }
        }).catch(err => console.error("An error occurred", err));
    }
    navBar = () => {
        this.navTitleView.fadeInUp(200)
        this.setState({
            showNavTitle: true
        })
    }

    timeConvertor = (timestamp) => {
        var a = new Date(timestamp * 1000);
        var seconds = Math.floor((new Date() - a) / 1000);

        var interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return interval + " Year" + this.timePlural(interval);
        }

        var interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval + " Month" + this.timePlural(interval);
        }

        var interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval + " Day" + this.timePlural(interval);
        }

        var interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval + " Hour" + this.timePlural(interval);
        }

        var interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval + " Minute" + this.timePlural(interval);
        }

        return Math.floor(seconds) + " Second" + this.timePlural(seconds)
    }
    timePlural = (s) => {
        if (s == 1) {
            return " ago"
        } else {
            return "s ago"
        }
    }
    setLike = (postID) => {
        if (this.state.liked == false) {
            var userId = f.auth().currentUser.uid;
            var set = 1;
            likeObj = {
                userId: userId,
                status: 1
            }
            database.ref("posts/" + postID + "/likes/" + userId).set(likeObj);
            //adding notifications
            var that = this
            if (that.state.userId != f.auth().currentUser.uid) {
                database.ref("notifications").child(that.state.userId).child("likes").child(postID).once("value").then(function (snapshot) {
                    const exsists = (snapshot.val() != null);
                    if (exsists) {
                        var data = snapshot.val();
                        var count = data.count
                        var date = Date.now();
                        var posted = Math.floor(date / 1000)
                        notification = {
                            id: postID,
                            status: 0,
                            posted: posted,
                            notification: f.auth().currentUser.displayName + " and " + count + " others loved your post",
                            count: count + 1,
                            image: that.state.image,
                            flag: "l"
                        }
                        database.ref("notifications/" + that.state.userId + "/likes/" + postID).set(notification);
                    } else {
                        var date = Date.now();
                        var posted = Math.floor(date / 1000)
                        notification = {
                            id: postID,
                            status: 0,
                            posted: posted,
                            notification: f.auth().currentUser.displayName + " loved your post",
                            count: 1,
                            image: that.state.image,
                            flag: "l"
                        }
                        console.log(notification)
                        database.ref("notifications/" + that.state.userId + "/likes/" + postID).set(notification);
                    }
                })
            }
        } else {
            var userId = f.auth().currentUser.uid;
            database.ref("posts/" + postID + "/likes/" + userId).remove();
            var that = this
            if (that.state.userId != f.auth().currentUser.uid) {
                database.ref("notifications").child(that.state.userId).child("likes").child(postID).once("value").then(function (snapshot) {
                    const exsists = (snapshot.val() != null);
                    if (exsists) {
                        var data = snapshot.val();
                        var count = data.count
                        var date = Date.now();
                        var posted = Math.floor(date / 1000)
                        if (count > 1) {
                            notification = {
                                id: postID,
                                status: 0,
                                posted: posted,
                                notification: count - 1 + " users loved your post",
                                count: count - 1,
                                image: that.state.image,
                                flag: "l"
                            }
                            database.ref("notifications/" + that.state.userId + "/likes/" + postID).set(notification);
                        } else {
                            database.ref("notifications/" + that.state.userId + "/likes/" + postID).remove();
                        }

                    }
                })
            }
        }
    }
    s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    uniqueId = () => {
        return this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4();
    }

    uploadImage = async () => {
        this.setState({
            currentFileType: ext,
            uploading: true
        });
        var uri = this.state.pickedImage
        var that = this;
        var postId = this.state.id;
        var re = /(?:\.([^.]+))?$/;
        var ext = re.exec(uri)[1];
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.log(e);
                reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });
        var filePath = postId + "finished." + that.state.currentFileType;

        var uploadTask = storage.ref("posts/images/" + this.state.animal).child(filePath).put(blob);

        uploadTask.on("state_changed", function (snapshot) {
            let progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
            that.setState({
                progress: progress
            });
        }, function (error) {
            console.log(error);

        }, function () {
            that.setState({
                progress: 100
            });
            // alert("done");
            uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                that.submitProofDatabase(downloadURL);
                console.log(downloadURL);
            }, function (error) {
                console.log(error)
            })
        })
    }
    handlePost = (id) => {
        var userId = f.auth().currentUser.uid;
        var ownerId = this.state.userId;
        var date = Date.now();
        var posted = Math.floor(date / 1000)
        var handleId = this.uniqueId();
        const accept = {
            handlerId: userId,
            posted: posted,
            image: this.state.image,
            status: 1
        }
        var mentor = {
            posted: posted,
            image: this.state.image,
            status: 1,
            id: id,
            type: this.state.type
        }

        var date = Date.now();
        var posted = Math.floor(date / 1000)
        notification = {
            id: id,
            status: 0,
            posted: posted,
            notification: f.auth().currentUser.displayName + " started to work on your post",
            image: this.state.image,
            flag: "h"
        }
        database.ref("notifications/" + ownerId + "/handle/" + id).set(notification);

        database.ref("/posts/" + id).update({ status: 1 });
        database.ref("users/" + ownerId + "/post/" + id).update({ status: 1 });
        database.ref("/ongoing/" + id).set(accept);
        database.ref("users/" + userId + "/handle/" + id).set(mentor);

    }

    deletePost = (id) => {
        var userId = f.auth().currentUser.uid;
        database.ref("posts/" + id).remove();
        database.ref("comments/" + id).remove();
        database.ref("users/" + userId + "/post/" + id).remove();
        this.props.navigation.goBack();

    }

    submitProof = () => {
        this.setState({
            proof: true
        })
    }
    selectPhoto = () => {
        ImagePicker.showImagePicker({ title: "Pick an Image", maxWidth: 800, maxHeight: 600, mediaType: "photo" }, res => {
            if (res.didCancel) {
                console.log("User cancelled!");
            } else if (res.error) {
                console.log("Error", res.error);
            } else {
                this.setState({
                    pickedImage: res.uri,
                });
            }
        });

    };

    submitProofDatabase = (image) => {
        var id = this.state.id;
        var userId = f.auth().currentUser.uid;
        var ownerId = this.state.userId;
        var date = Date.now();
        var posted = Math.floor(date / 1000);
        const done = {
            handlerId: userId,
            posted: posted,
            image: image,
            status: 2,
            description: this.state.proofDescription,
        }
        var finished = {
            posted: posted,
            image: image,
            status: 2,
            id: id,
            description: this.state.proofDescription,
        }

        //notification start
        var date = Date.now();
        var posted = Math.floor(date / 1000)
        notification = {
            id: id,
            status: 0,
            posted: posted,
            notification: f.auth().currentUser.displayName + " rescued the animal.",
            image: this.state.image,
            flag: "f"
        }
        database.ref("notifications/" + ownerId + "/finish/" + id).set(notification);
        //notification ends 

        database.ref("/posts/" + id).update({ status: 2 });
        database.ref("users/" + ownerId + "/post/" + id).update({ status: 2 });
        database.ref("users/" + userId + "/handle/" + id).remove();
        database.ref("/ongoing/" + id).remove();
        database.ref("/finshed/" + id).set(done);
        database.ref("users/" + userId + "/finished/" + id).set(finished);
        this.setState({
            uploading: false,
            proof: false
        })
    }
    render() {
        const { navigate } = this.props.navigation;

        if (this.state.uploading == true) {
            return (
                <View style={styles.overlay}>
                    <ProgressBarAndroid
                        styleAttr="Large"
                        indeterminate={false}
                        style={{ height: 80, borderRadius: 50 }}
                        color="#fff"
                    />
                </View>
            );
        } else if (this.state.uploading == false) {
            return (
                <View style={styles.container}>
                    <StatusBar backgroundColor="#00063f" barStyle="light-content" />
                    <HeaderImageScrollView
                        ref={ref => this.scrollView = ref}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            if (this.state.proof == true) {
                                this.scrollView.scrollToEnd({ animated: true });
                            }
                        }}
                        maxHeight={200}
                        minHeight={50}
                        // headerImage={{ uri: this.state.image }}
                        fadeOutForeground
                        style={{ marginBottom: 10 }}
                        renderHeader={() => {
                            if (this.state.type == 0) {
                                return (
                                    <Image source={{ uri: this.state.image }} style={styles.image} />
                                )
                            } else {
                                return (
                                    // <View style={{alignItems:"center", justifyContent:"center", width:"100%", backgroundColor:COLOR_GRAY}}>
                                    <Video
                                        ref={(ref) => {
                                            this.player = ref
                                        }}
                                        source={{ uri: this.state.image }}
                                        volume={10}
                                        repeat={true}
                                        resizeMode="cover"
                                        fullscreen={true}
                                        controls={false}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            width: "100%",
                                            alignSelf: "center"
                                        }} />
                                    // </View>


                                )

                            }

                        }
                        }

                        renderFixedForeground={() => (
                            <Animatable.View
                                style={{ height: "auto", width: "100%" }}
                                ref={navTitleView => {
                                    this.navTitleView = navTitleView;
                                }}
                            >
                                {this.state.showNavTitle == true ? (
                                    <ModalHeader title="Post" onPress={() => this.props.navigation.goBack()} />
                                ) : (
                                        <TouchableOpacity>

                                        </TouchableOpacity>
                                    )}

                            </Animatable.View>
                        )}
                    >

                        <TriggeringView
                            onHide={() => this.navBar()}
                            onDisplay={() => this.navTitleView.fadeOut(200)}
                        >
                        </TriggeringView>
                        <View style={styles.topView}>
                            <View style={styles.informationArea}>
                                <Text style={styles.name}>{this.state.animal}</Text>
                                <Text style={styles.description}>
                                    {this.state.description}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.topView}>

                            <MapView
                                style={styles.mapContainer}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={{
                                    latitude: this.state.latitude,
                                    longitude: this.state.longitude,
                                    latitudeDelta: 0.00922 * 1.5,
                                    longitudeDelta: 0.00421 * 1.5,
                                }}
                                showsUserLocation={true}
                                loadingEnabled={true}
                                zoomControlEnabled={true}
                                showsMyLocationButton={true}
                                scrollEnabled={false}
                            // ref={ref => { this.mapView = ref }}
                            >

                                {this.state.latitude != null && this.state.latitude != null ? (
                                    <Marker
                                        coordinate={{
                                            latitude: this.state.latitude,
                                            longitude: this.state.longitude,
                                            latitudeDelta: 0.00922 * 1.5,
                                            longitudeDelta: 0.00421 * 1.5,
                                        }}
                                        title={"Here is the Animal"}

                                    />

                                ) : (
                                        <View></View>
                                    )}

                            </MapView>



                            <TouchableScale onPress={() => this.openMap()}
                                style={{
                                    position: "absolute",//use absolute position to show button on top of the map
                                    top: "70%", //for center align
                                    right: 5,
                                    alignSelf: "flex-end", //for align to right                                                               
                                    width: "auto",
                                    borderRadius: 15,
                                    paddingHorizontal: 10,
                                    paddingVertical: 10,
                                    backgroundColor: "#192f6a",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row"
                                }}
                            >
                                <Icon name="compass" size={24} color={"#fff"} style={{ alignSelf: "center" }} />
                                <Text style={{ color: "#fff", fontSize: 14, marginLeft: 2 }}> Get Direction</Text>
                            </TouchableScale>


                        </View>

                        <View style={styles.profile}>
                            <Image style={styles.avatar}
                                source={{ uri: this.state.avatar }} />

                            <Text style={styles.profileName}>
                                {this.state.name}
                            </Text>
                            <Text style={{ marginLeft: 20 }}>
                                {this.timeConvertor(this.state.posted)}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <View
                                style={styles.likeCommentArea}
                            >

                                {this.state.liked == false ? (
                                    <TouchableOpacity style={[styles.row, { alignItems: "flex-end" }]} onPress={() => this.setLike(this.state.id)} >
                                        <Icon name="heart" size={24} />
                                    </TouchableOpacity>
                                ) : (
                                        <TouchableOpacity style={[styles.row, { alignItems: "flex-end" }]} onPress={() => this.setLike(this.state.id)}>
                                            <Icon name="heart" size={24} color={"#a83f39"} />
                                        </TouchableOpacity>
                                    )}


                            </View>

                            <View
                                style={styles.likeCommentArea}
                            >
                                <TouchableOpacity style={[styles.row, { alignItems: "flex-start" }]} onPress={() => navigate("Comment", { id: this.state.id })}>
                                    <Icon name="comment" size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* <View style={styles.starContainer}>
                            <Image style={styles.star} source={{ uri: "https://img.icons8.com/color/40/000000/star.png" }} />
                            <Image style={styles.star} source={{ uri: "https://img.icons8.com/color/40/000000/star.png" }} />
                            <Image style={styles.star} source={{ uri: "https://img.icons8.com/color/40/000000/star.png" }} />
                            <Image style={styles.star} source={{ uri: "https://img.icons8.com/color/40/000000/star.png" }} />
                            <Image style={styles.star} source={{ uri: "https://img.icons8.com/color/40/000000/star.png" }} />
                        </View>
                        <View style={styles.contentColors}>
                            <TouchableOpacity style={[styles.btnColor, { backgroundColor: "#00BFFF" }]}></TouchableOpacity>
                            <TouchableOpacity style={[styles.btnColor, { backgroundColor: "#FF1493" }]}></TouchableOpacity>
                            <TouchableOpacity style={[styles.btnColor, { backgroundColor: "#00CED1" }]}></TouchableOpacity>
                            <TouchableOpacity style={[styles.btnColor, { backgroundColor: "#228B22" }]}></TouchableOpacity>
                            <TouchableOpacity style={[styles.btnColor, { backgroundColor: "#20B2AA" }]}></TouchableOpacity>
                            <TouchableOpacity style={[styles.btnColor, { backgroundColor: "#FF4500" }]}></TouchableOpacity>
                        </View>
                        <View style={styles.contentSize}>
                            <TouchableOpacity style={styles.btnSize}><Text>S</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnSize}><Text>M</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnSize}><Text>L</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnSize}><Text>XL</Text></TouchableOpacity>
                        </View> */}
                        <View style={styles.separator}></View>
                        <View style={styles.addToCarContainer}>
                            {this.state.userId == this.state.authorId ? (
                                this.state.status == 0 ? (
                                    <TouchableOpacity style={styles.shareButton} onPress={() =>
                                        Alert.alert(
                                            "Delete Post",
                                            "Are you sure you want to Delete This post",
                                            [
                                                {
                                                    text: "Cancel",
                                                    onPress: () => console.log("Canceled"),
                                                    style: "cancel",
                                                },
                                                { text: "OK", onPress: () => this.deletePost(this.state.id) },
                                            ],
                                            { cancelable: false },
                                        )
                                    }>
                                        <Text style={styles.shareButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                ) : (
                                        this.state.status == 1 ? (
                                            <View style={styles.profile}>
                                                <Text style={{ fontSize: 18, marginHorizontal: 10 }}>Rescuer</Text>
                                                <Image style={styles.avatar}
                                                    source={{ uri: this.state.handlerAvatar }} />

                                                <Text style={styles.profileName}>
                                                    {this.state.handlerName}
                                                </Text>
                                                <Text style={{ marginLeft: 20 }}>
                                                    Started to work on  {this.timeConvertor(this.state.handlerPosted)}
                                                </Text>
                                            </View>
                                        ) : (
                                                <View style={styles.profile}>
                                                    <Text style={{ fontSize: 18, marginHorizontal: 10 }}>Rescuer</Text>
                                                    <Image style={styles.avatar}
                                                        source={{ uri: this.state.handlerAvatar }} />

                                                    <Text style={styles.profileName}>
                                                        {this.state.handlerName}
                                                    </Text>
                                                    <Text style={{ marginLeft: 20 }}>
                                                        Finished  {this.timeConvertor(this.state.handlerPosted)}
                                                    </Text>
                                                    <Text style={styles.description}>
                                                        {this.state.handlerDescription}
                                                    </Text>
                                                    <Image source={{ uri: this.state.handlerImages }} style={{ width: "100%", height: 200, marginTop: 10 }} />
                                                </View>
                                            )
                                    )



                            ) : (
                                    this.state.status == 0 ? (
                                        <TouchableOpacity style={styles.shareButton} onPress={() =>
                                            Alert.alert(
                                                "Confirming the Handling",
                                                "Are you sure you want to handle this",
                                                [
                                                    {
                                                        text: "Cancel",
                                                        onPress: () => console.log("canceled"),
                                                        style: "cancel",
                                                    },
                                                    { text: "OK", onPress: () => this.handlePost(this.state.id) },
                                                ],
                                                { cancelable: false },
                                            )
                                        }>
                                            <Text style={styles.shareButtonText}>I will Handle</Text>
                                        </TouchableOpacity>
                                    ) : (
                                            this.state.status == 1 ? (
                                                <View style={styles.profile}>
                                                    <Text style={{ fontSize: 18, marginHorizontal: 10 }}>Rescuer</Text>
                                                    <Image style={styles.avatar}
                                                        source={{ uri: this.state.handlerAvatar }} />

                                                    <Text style={styles.profileName}>
                                                        {this.state.handlerName}
                                                    </Text>
                                                    <Text style={{ marginLeft: 20 }}>
                                                        Started to work on  {this.timeConvertor(this.state.handlerPosted)}
                                                    </Text>

                                                    {f.auth().currentUser.uid == this.state.handlerId && this.state.proof == false ? (
                                                        <TouchableOpacity style={styles.shareButton} onPress={() => this.submitProof()}>
                                                            <Text style={styles.shareButtonText}>    Submit Proof    </Text>
                                                        </TouchableOpacity>

                                                    ) : (
                                                            <View></View>
                                                        )}
                                                </View>
                                            ) : (
                                                    <View style={styles.profile}>
                                                        <Text style={{ fontSize: 18, marginHorizontal: 10 }}>Rescuer</Text>
                                                        <Image style={styles.avatar}
                                                            source={{ uri: this.state.handlerAvatar }} />

                                                        <Text style={styles.profileName}>
                                                            {this.state.handlerName}
                                                        </Text>
                                                        <Text style={{ marginLeft: 20 }}>
                                                            Finished  {this.timeConvertor(this.state.handlerPosted)}
                                                        </Text>
                                                        <Text style={styles.description}>
                                                            {this.state.handlerDescription}
                                                        </Text>
                                                        <Image source={{ uri: this.state.handlerImages }} style={{ width: "100%", height: 200, marginTop: 10 }} />
                                                    </View>
                                                )

                                        )

                                )}
                            {this.state.proof == true ? (
                                <View style={{ justifyContent: "center", alignItems: "center", marginVertical: 5 }}>
                                    {this.state.pickedImage == null ? (
                                        <TouchableOpacity style={styles.imageContainer} onPress={() => this.selectPhoto()}>
                                            <Text>Select an Image</Text>
                                        </TouchableOpacity>
                                    ) : (
                                            <TouchableOpacity style={styles.imageContainer} onPress={() => this.selectPhoto()}>
                                                <Image source={{ uri: this.state.pickedImage }} style={{ width: "100%", height: "100%" }} />
                                            </TouchableOpacity>
                                        )}

                                    <KeyboardAvoidingView behavior="padding" enabled={true}>
                                        {this.state.proofDescription.length.toString() <= 50 ? (
                                            <TextInput
                                                style={[styles.descriptiontStyle, { fontSize: 28 }]}
                                                placeholder={"Enter Description Here"}
                                                editable={true}
                                                multiline={true}
                                                numberOfLines={5}
                                                maxlength={750}
                                                value={this.state.proofDescription}
                                                onChangeText={(text) => this.setState({ proofDescription: text })}
                                            />
                                        ) : (
                                                <TextInput
                                                    style={[styles.descriptiontStyle, { fontSize: 18 }]}
                                                    editable={true}
                                                    multiline={true}
                                                    numberOfLines={5}
                                                    maxlength={750}
                                                    value={this.state.proofDescription}
                                                    onChangeText={(text) => this.setState({ proofDescription: text })}
                                                />
                                            )}


                                    </KeyboardAvoidingView>
                                    <TouchableOpacity style={styles.shareButton} onPress={() => this.uploadImage()}>
                                        <Text style={styles.shareButtonText}>     Submit Proof     </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                    <View></View>
                                )}

                        </View>


                    </HeaderImageScrollView>
                </View>
            );
        } else {
            return (
                <View />
            );
        }

    }
}