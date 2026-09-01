import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BottomNav, Header, Screen } from '../components';
import { colors } from '../theme';
export default function Styles(){
  return (
    <Screen><View style={{flex:1}}><ScrollView contentContainerStyle={styles.content}><Header title="Saved Designs" back/><Text style={styles.title}>Your Designs</Text><Text style={styles.sub}>Custom styles saved for your clients.</Text><View style={styles.grid}>{['Modern Senator','Modern Kaftan','Traditional Two-Piece','Mandarin Set'].map((x,i)=><Pressable key={x} onPress={()=>router.push('/style/1' as any)} style={styles.card}><Image source={require('../../assets/images/senator.png')} style={styles.img}/><Text style={styles.name}>{x}</Text><Text style={styles.meta}>Saved for Nana Kwame</Text></Pressable>)}</View></ScrollView><BottomNav active="Designs"/></View></Screen>
  );
}
const styles=StyleSheet.create({content:{padding:16},title:{fontSize:21,fontWeight:'800',color:colors.text},sub:{fontSize:10,color:colors.muted,marginTop:4,marginBottom:15},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},card:{width:'48%',backgroundColor:'#fff',borderWidth:1,borderColor:colors.line,borderRadius:12,padding:9},img:{width:'100%',height:160,borderRadius:8,backgroundColor:'#eee'},name:{fontSize:11,fontWeight:'800',color:colors.text,marginTop:8},meta:{fontSize:8,color:colors.muted,marginTop:3}})
