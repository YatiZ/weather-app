'use client'
import React, { useState } from 'react'
import { MdMyLocation, MdOutlineLocationOn, MdWbSunny } from 'react-icons/md'
import SearchBox from './SearchBox'
import axios from 'axios';
import { useAtom } from 'jotai';
import { loadingCityAtom, placeAtom } from '@/app/atom';

type Props = {location?: string}
export default function NavBar(props:Props) {
    const [city, setCity] = useState("");
    const [suggested, setSuggested] = useState<string[]>([]);
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [error, setError] = useState('');
    const [place, setPlace] = useAtom(placeAtom);
    const [,setLoadingCity] = useAtom(loadingCityAtom);

    async function handleChange(value: string){
       setCity(value)
       if(value.length >=3){
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/find?q=${value}&appid=93f16c5b0325cd969b9ad1344cf54497`
            );
            console.log('Response: ',response.data)
            const suggestion = response.data.list.map((item: any) => item.name);
            setSuggested(suggestion)
            setError("");
            setShowSuggestion(true)
        } catch (error) {
            console.log(error)
            setSuggested([])
            setShowSuggestion(false)
            
        }
        
       }else{
        setSuggested([])
        setShowSuggestion(false)
       }
    }

    function handleSuggestClick(value: string){
        setCity(value);
        
        setShowSuggestion(false)
    }
    function handleSubmitSearch (e: React.FormEvent<HTMLFormElement>){
        setLoadingCity(true)
        e.preventDefault();
        if(suggested.length ===0){
            setError("Location not Found");
            setLoadingCity(false)
        }else{
            setError('')
            setTimeout(()=>{
                setPlace(city)
                setShowSuggestion(false)
                setLoadingCity(false)
            },500);
            
        }
    }
    function handleCurrentLocation(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(async(position)=>{
                const {latitude, longitude} = position.coords;
                try {
                    setLoadingCity(true);
                    const response = await axios.get(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=93f16c5b0325cd969b9ad1344cf54497`
                    );
                    setTimeout(()=>{
                        setLoadingCity(false)
                        setPlace(response.data.name)
                    },500)
                } catch (error) {
                    setLoadingCity(false)
                    console.log(error)
                }
            })
        }
    }
  return (
    <>
    <nav className='shadow-sm sticky top-0 left-0 z-50 bg-white'>
      <div className='h-[80px] w-full flex justify-between items-center max-w-7xl px-3 mx-auto'>
        <div className='flex items-center justify-center gap-2'>
            <h2 className='text-gray-500 text-3xl'>Weather</h2>
            <MdWbSunny className='text-3xl mt-1 text-yellow-300'/>
        </div>

        <section className='flex gap-2 items-center'>
            <MdMyLocation onClick={handleCurrentLocation} title='Your Current Location' className='text-2xl text-gray-400 hover:cursor-pointer'/>
            <MdOutlineLocationOn className='text-3xl'/>
            <p className='text-slate-900/80 text-sm'>{props.location}</p>
            <div className='relative hidden md:flex'>
                <SearchBox value={city} onChange={(e)=>handleChange(e.target.value)} onSubmit={handleSubmitSearch}/>
                <SuggestionBox 
                  {...{
                    showSuggestion,
                    suggested,
                    handleSuggestClick,
                    error
                  }}
                />
            </div>
        </section>

      
      </div>
    </nav>
    <section className='flex max-w-7xl px-3 md:hidden'>
    <div className='relative'>
                <SearchBox value={city} onChange={(e)=>handleChange(e.target.value)} onSubmit={handleSubmitSearch}/>
                <SuggestionBox 
                  {...{
                    showSuggestion,
                    suggested,
                    handleSuggestClick,
                    error
                  }}
                />
    </div>
    </section>
    

    </>

  )
}

function SuggestionBox({
    showSuggestion,
    suggested,
    handleSuggestClick,
    error
}:{
    showSuggestion: boolean,
    suggested: string[],
    handleSuggestClick: (item: string)=> void;
    error: string
}){
    
   return(
    <>
     {((showSuggestion && suggested.length > 1) || error) && (
        <ul className='mb-4 bg-white absolute border top-[44px] left-0 border-gray-300 rounded-md min-w-[200px] flex flex-col gap-1 py-2 px-2'>
            {error && suggested.length < 1 && (
                <li className='text-red-500 p-1'>{error}</li>
            )}
            {suggested.map((d,i)=>(
                <li key={i} onClick={()=> handleSuggestClick(d)} className='cursor-pointer p-1 rounded hover:bg-gray-200'>
                    {d}
                </li>
            ))}
        
     </ul>
     )}
    </>
   )
}
