import axios from 'axios';
import { Address,
         bytesToHex,
         TxInput, 
         } from "@hyperionbt/helios";

export {
    getNetworkParams,
    getVestingRefUtxo,
    getVestingUtxo,
    network
}

const network = "preprod"
const env = process.env.NEXT_PUBLIC_ENV as string;
const host = process.env.NEXT_PUBLIC_HOST as string;
const port = env == "dev" ? process.env.NEXT_PUBLIC_PORT as string : "";
const protocol = process.env.NEXT_PUBLIC_PROTOCOL as string;
const baseURL = protocol + '://' + host + port;
if (host === "" || protocol == "") {
    alert("Please make sure you host and protocol environment variables are set");
    throw console.error("Please make sure you host, port and protocol environment variables are set");
}


async function getNetworkParams(network: string) {

    var networkParamsUrl;
    if (network === "preview") {
        networkParamsUrl = "https://d1t0d7c2nekuk0.cloudfront.net/preview.json";
    } else if (network === "preprod") {
        networkParamsUrl = "https://d1t0d7c2nekuk0.cloudfront.net/preprod.json";
    } else if (network === "mainnet") {
        networkParamsUrl = "https://d1t0d7c2nekuk0.cloudfront.net/mainnet.json";
    } else {
        alert("Network not set");
        throw console.error("getNetworkParams: network not set");
    }
    try {
       let res = await axios({
            url: networkParamsUrl,
            method: 'get',
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if(res.status == 200){
            return res.data;
        } else {
          throw console.error("getNetworkParams: error getting network params: ", res);
        }   
    }
    catch (err) {
        throw console.error("getNetworkParams: error getting network params: ", err);
    }
}

const getVestingUtxo = async (vestingValidatorAddr: Address): Promise<TxInput> => {

    const payload = { 
        addr: vestingValidatorAddr.toBech32()
    }
    const api = "/api/vestingUtxo";

    try {
      let res = await axios({
            baseURL: baseURL,
            url: api,
            data: payload,
            method: 'post',
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if(res.status == 200){
            return TxInput.fromFullCbor(res.data);
        } else {
          console.error("getVestingUtxo Error: ", res);
          throw res.data;
        }   
    }
    catch (err) {
        console.error("getVestingUtxo Failed: ", err);
        throw err;
    }
}  

const getVestingRefUtxo = async (vestingValidatorAddr: Address): Promise<TxInput> => {

    const payload = { 
        addr: vestingValidatorAddr.toBech32()
    }
    const api = "/api/vestingRefUtxo";

    try {
      let res = await axios({
            baseURL: baseURL,
            url: api,
            data: payload,
            method: 'post',
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if(res.status == 200){
            return TxInput.fromFullCbor(res.data);
        } else {
          console.error("getVestingRefUtxo Error: ", res);
          throw res.data;
        }   
    }
    catch (err) {
        console.error("getVestingRefUtxo Failed: ", err);
        throw err;
    }
}  

