const URL='http://localhost:3001/api/'


async function login(credentials){
    const queryURL=URL+'login';

    const response = await fetch(queryURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      if(response.ok) {
        return response.json();
      }
      else {
        return false;       //returns error details
      }
}

async function getUserInfo(){
    const queryURL= URL+'sessions/current';
    const response = await fetch(queryURL, {
        credentials: 'include',
      });
      const res = await response.json();
      if (response.ok) {
        return res;
      } else {
        throw res;  // an object with the error coming from the server
      }
}

async function logout(){
    const queryURL=URL+'logout';
    const response = await fetch(queryURL, {
        method: 'POST',
        credentials: 'include'
      }).catch(()=>{throw ("Server Error");});
    if (response.ok)
        return true;
}



module.exports={login,getUserInfo,logout}