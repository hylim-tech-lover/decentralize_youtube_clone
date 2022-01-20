import React, { Component } from 'react';
import DVideo from '../abis/DVideo.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  /* web3 standard API that take metamask Eth account and inject to the code*/
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    //Load accounts
    //Add first account the the state
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    //Store first item of accounts 
    this.setState({account: accounts[0]})
    //Get network ID (Configured in metamask)
    const networkId = await web3.eth.net.getId()
    //Get network data from generated JSON of smart contract
    const networkData = DVideo.networks[networkId] 
    //Check if net data exists, then
      //Assign dvideo contract to a variable
      if(networkData){
        const dvideo = new web3.eth.Contract(DVideo.abi,networkData.address)
        //Add dvideo to the state
        this.setState({dvideo}) // if same name of state object and local var like above, can write as such
        //Check videoAmounts
        const videosCount = await dvideo.methods.videoCount().call() // Call this function/property that is publicly available
        //Add videAmounts to the state
        this.setState({videosCount})
        //Iterate throught videos and add them to the state (by newest-last index)
        for(var i=videosCount;i>=1;i--){
          const video = await dvideo.methods.videos(i).call() // Call this properties based on index. This is sort of like simple database object with index
          this.setState({
            // Add newly load video to the state array to the last index
            videos:[...this.state.videos, video]
          })
        }

        //Set latest video and it's title to view as default 
        const latest = await dvideo.methods.videos(videosCount).call()
        this.setState({
          currentHash: latest.hash,
          currentTitle: latest.title
        })
        //Set loading state to false
        this.setState({loading:false})

      }else{  
        window.alert('DVideo smart contract is not deployed to detected network.')
      }    
      
  }

  //Get video
  captureFile = event => {
    event.preventDefault()
    // Get file from input and convert to array buffer
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    
    // function when reader finished loaded
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result)
      })
      console.log('buffer', this.state.buffer)
    }
  }

  //Upload video
  uploadVideo = title => {
    console.log('Submitting file to IPFS')
    // Add to IPFS
    this.setState({loading: true})
    ipfs.add(this.state.buffer,(error,result)=>{
      //callback function
      //Put on blockchain on hash address in IPFS
      if(error){
        // Error handling
        console.log('Error while uploading to IPFS', error)
        this.setState({loading: true})
        return
      } 
      
      else {
         console.log('IPFS result', result)
         // Get hash address from result first array element and title from event
         // to update state in smart contract, we have to use send and set sender address
         this.state.dvideo.methods.uploadVideo(result[0].hash,title).send({from: this.state.account})
         .on('transactionHash',(hash)=>{
           // callback function after send function on transactionHash event
           this.setState({loading: false})
           window. location. reload() 
         })
      }      
    })
  }

  //Change Video
  changeVideo = (hash, title) => {
    this.setState({'currentHash': hash})
    this.setState({'currentTitle': title})
  }

  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      account: '',
      dvideo:null,
      videos:[],
      buffer:null,
      currentHash:null,
      currentTitle:null
      //set states
    }

    //Bind functions
    this.uploadVideo = this.uploadVideo.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.changeVideo = this.changeVideo.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account}
          //Account
        />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main 
              captureFile={this.captureFile} // Link property to event
              uploadVideo={this.uploadVideo }
              changeVideo={this.changeVideo}
              currentHash={this.state.currentHash}
              currentTitle={this.state.currentTitle}
              videos={this.state.videos}
            />
        }
      </div>
    );
  }
}

export default App;