import Builds from '@/components/Builds';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Builds id={id}/>}
