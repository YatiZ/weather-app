export function metersToKiloM(visibilityInMeters: number){
    const visibilityInKilometers = visibilityInMeters / 1000;
    return `${visibilityInKilometers.toFixed(0)}km`;
}