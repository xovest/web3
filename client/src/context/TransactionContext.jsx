import React, { createContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'

import { contractABI, contractAddress } from '../utils/constants'

export const TransactionContext = createContext()

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum)
  const signer = provider.getSigner()
  const transactionContract = new ethers.Contract(contractAddress, contractABI, signer)

  return transactionContract
}

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('')
  const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: ''})
  const [isLoading, setIsLoading] = useState(false)
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }))
  }

  const checkWalletConnected = async () => {
    if (!ethereum) return alert('Install metamask dude')

    const accounts = await ethereum.request({ method: 'eth_accounts' })

    console.log(accounts);
  }

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert('Install metamask dude')

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

      if (accounts.length) {
        setCurrentAccount(accounts[0])


      } else {
        console.log('no accs found');
      }

      setCurrentAccount(accounts[0])
    } catch (err) {
      console.log(err);

      throw new Error('No eth obj')
    }
  }

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert('Install metamask dude')

      const { addressTo, amount, keyword, message } = formData
      const transactionContract = getEthereumContract()
      const parsedAmount = ethers.utils.parseEther(amount)

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: '0x5208', //21k gwei
          value: parsedAmount._hex, //0.00001
        }]
      })

      const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword)

      setIsLoading(true)
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait()
      setIsLoading(false)
      console.log(`Success - ${transactionHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount()

      setTransactionCount(transactionCount.toNumber())
    } catch (err) {
      console.log(err);

      throw new Error('No eth obj')
    }
  }

  useEffect(() => {
    checkWalletConnected()
  }, [])

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction }}>
      {children}
    </TransactionContext.Provider>
  )
}