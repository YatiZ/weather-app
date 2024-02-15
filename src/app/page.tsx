'use client'
import Container from "@/components/Container";
import ForecastWeatherDetails from "@/components/ForecastWeatherDetails";
import NavBar from "@/components/NavBar";
import WeatherDetails from "@/components/WeatherDetails";
import WeatherIcon from "@/components/WeatherIcon";
import { convertKtoC } from "@/utils/convertKtoC";
import { convertWindSpeed } from "@/utils/convertWindSpeed";
import { getDayOrNightIcon } from "@/utils/getDayOrNight";
import { metersToKiloM } from "@/utils/metersToKiloM";
import axios from "axios";
import { format, fromUnixTime, parseISO } from "date-fns";
import { useAtom } from "jotai";

import { useQuery } from "react-query";
import { loadingCityAtom, placeAtom } from "./atom";
import { useEffect } from "react";

interface Main {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  sea_level: number;
  grnd_level: number;
  humidity: number;
  temp_kf: number;
}

interface Weather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface Clouds {
  all: number;
}

interface Wind {
  speed: number;
  deg: number;
  gust: number;
}

interface Sys {
  pod: string;
}

interface List {
  dt: number;
  main: Main;
  weather: Weather[];
  clouds: Clouds;
  wind: Wind;
  visibility: number;
  pop: number;
  sys: Sys;
  dt_txt: string;
}

interface Coord {
  lat: number;
  lon: number;
}

interface City {
  id: number;
  name: string;
  coord: Coord;
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

interface WeatherData {
  cod: string;
  message: number;
  cnt: number;
  list: List[];
  city: City;
}


export default function Home() {
  const [place, setPlace] = useAtom(placeAtom);
  const [loadingCity] = useAtom(loadingCityAtom);
  
  const {isLoading, error, data,refetch} = useQuery<WeatherData>("repoData", async()=>{
    const {data} = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=93f16c5b0325cd969b9ad1344cf54497&cnt=56`
    );
   
    return data;
  }
  );

  useEffect(()=>{
    refetch();
  },[place,refetch])


  const firstData = data?.list[0];

  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry)=> new Date(entry.dt * 1000).toISOString().split("T")[0]
      )
    )
  ]


  //filtering data to get the first entry after 6AM for each unique date
  const firstDataForEachDate = uniqueDates.map((date)=>{
    return data?.list.find((entry)=>{
      const entryDate = new Date(entry.dt * 1000). toISOString().split("T")[0];
      const entryTime = new Date(entry.dt * 1000).getHours();
      return entryDate === date && entryTime >=6;
    })
  })
  
  if(isLoading){
    return(
      <div className="flex items-center min-h-screen justify-center">
        <p className="animate-bounce">Loading ...</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen">
      <NavBar location={data?.city.name}/>
      {loadingCity ? <WeatherSkeleton/> :
      <>
      <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
        {/* for today data section */}
        <section className="space-y-4">
           <div>
            <h2 className="flex gap-1 items-end">
              <p className="text-lg">{format(parseISO(firstData?.dt_txt ?? ""),"EEEE")}</p>
              <p>({format(parseISO(firstData?.dt_txt ?? ""),"dd.MM.yyy")})</p>
            </h2>
            <Container className="gap-10 px-6 items-center">

              {/* temperature */}
               <div className="flex flex-col px-4">
                <span className="text-5xl">
                {convertKtoC(firstData?.main.temp ?? 0)}°
                </span>
                 <p className="text-xs space-x-1 whitespace-nowrap">
                  <span>Feels like</span>
                  <span>
                        {convertKtoC(
                          firstData?.main.feels_like ?? 0
                        )}
                        °
                  </span>
                 </p>
                 <p className="text-xs space-x-2">
                  <span>{convertKtoC(firstData?.main.temp_min ?? 0)}°↓</span>
                  <span>{convertKtoC(firstData?.main.temp_max ?? 0)}°↑</span>
                 </p>
               
               </div>

               {/* time and weather icon */}
               <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3 py-4">
                  {data?.list.map((d, i)=>(
                    <div key={i} className="flex-col flex justify-between gap-2 items-center text-xs font-semibold">
                       <p className="whitespace-nowrap">
                        {format(parseISO(d.dt_txt),"hh:mm a")}
                       </p>
                       
                       <WeatherIcon iconName={getDayOrNightIcon(d.weather[0].icon,d.dt_txt)}/>
                       <p>
                        {convertKtoC(d?.main.temp ?? 0)}°
                       </p>
                    </div>
                  ))}
               </div>
            </Container>
           </div>
           <div className="flex gap-4">
              <Container className="w-fit justify-between flex-col px-4 items-center">
                   <p className="capitalize text-center">
                    {firstData?.weather[0].description}{" "}
                   </p>
                   <WeatherIcon iconName={getDayOrNightIcon(firstData?.weather[0].icon?? "", firstData?.dt_txt ?? "")}/>
              </Container>
              <Container className="bg-yellow-300/80 px-6 gap-4 justify-between overflow-x-auto">
                  <WeatherDetails visability={metersToKiloM(firstData?.visibility ?? 10000)} humidity={`${firstData?.main.humidity}%`} windSpeed={convertWindSpeed(firstData?.wind.speed ?? 3.03)} airPressure={`${firstData?.main.pressure}hPa`} sunrise={format(fromUnixTime(data?.city.sunrise ?? 1702949452),"H:mm")} sunset={format(fromUnixTime(data?.city.sunset ?? 1702949452),"H:mm")} />
              </Container>
           </div>
        </section>

       
        
        {/* for 7 days data section */}
        <section className="flex w-full flex-col gap-4">
          <p className="text-2xl">Forecast (7days)</p>
          {firstDataForEachDate.map((d,i)=>(
            <ForecastWeatherDetails key={i}
             weatherIcon={d?.weather[0].icon ?? "01d"} 
             date={format(parseISO(d?.dt_txt ?? ""),"dd.MM.yyyy")} 
             day={format(parseISO(d?.dt_txt ?? ""),"EEEE")} 
             temp={d?.main.temp ?? 0} 
             feels_like={d?.main.feels_like ?? 0} 
             temp_min={d?.main.temp_min ?? 0} 
             temp_max={d?.main.temp_max ?? 0} 
             description={d?.weather[0].description ?? ""} 
             visability={`${metersToKiloM(d?.visibility ?? 10000)}`}
             humidity={`${d?.main.humidity}%`} 
             windSpeed={`${convertWindSpeed(d?.wind.speed ?? 1.64)}`} 
             airPressure={`${d?.main.pressure} hPa`} 
             sunrise={format(fromUnixTime(data?.city.sunrise ?? 1702949452),"H:mm")} 
             sunset={format(fromUnixTime(data?.city.sunset ?? 1702949452),"H:mm")} />
          ))}
          
        </section>
      </main>
      </>
      }
      
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <section className="space-y-8 ">
      {/* Today's data skeleton */}
      <div className="space-y-2 animate-pulse">
        {/* Date skeleton */}
        <div className="flex gap-1 text-2xl items-end ">
          <div className="h-6 w-24 bg-gray-300 rounded"></div>
          <div className="h-6 w-24 bg-gray-300 rounded"></div>
        </div>

        {/* Time wise temperature skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
              <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 days forecast skeleton */}
      <div className="flex flex-col gap-4 animate-pulse">
        <p className="text-2xl h-8 w-36 bg-gray-300 rounded"></p>

        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
            <div className="h-8 w-28 bg-gray-300 rounded"></div>
            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            <div className="h-8 w-28 bg-gray-300 rounded"></div>
            <div className="h-8 w-28 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
