pragma solidity ^0.5.0;

// Workflow of smart contract
// 1. Model the video struct
// 2. Store the video 
// 3. Upload the video
// 4. List video

contract DVideo {
  uint public videoCount = 0;
  string public name = "DVideo";
  
  //Create id=>struct mapping (store video)
  // mapping is default solidity to assign unit to each Video class and return as videos
  mapping(uint=>Video) public videos;

  //Create Struct video (model video struct)
  struct Video {
    uint id;          // unsigned int of identifier of video
    string hash;      // ipfs hash address
    string title;     // video title    
    address author;   // smart contract address of author
  }

  //Create Event
  event VideoUploaded (
    uint id,          
    string hash,   
    string title,     
    address author   
  );

  constructor() public {
  }

  function uploadVideo(string memory _videoHash, string memory _title) public {
    // Make sure the video hash exists - require() equivalent to if else statement 
    require(bytes(_videoHash).length >0);
    // Make sure video title exists
    require(bytes(_title).length >0);
    // Make sure uploader address exists
    require(msg.sender!=address(0));

    // Increment video id
    videoCount++;
    // Add video to the contract (Constructor of video struct)
    videos[videoCount] = Video(videoCount, _videoHash, _title, msg.sender);
    
    // Trigger an event
    emit VideoUploaded(videoCount, _videoHash, _title, msg.sender);
  }

}
