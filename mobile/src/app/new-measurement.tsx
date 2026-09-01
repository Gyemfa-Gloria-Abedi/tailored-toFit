import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Header, PrimaryButton, Screen } from '../components';
import { colors } from '../theme';
const fields=['Neck','Shoulder Width','Chest','Waist','Hip','Back Length','Across Chest','Sleeve Length','Bicep','Wrist'];
export default function NewMeasurement(){
  return (
    <Screen><ScrollView contentContainerStyle={styles.content}><Header title="New Measurement" back/><Text style={styles.title}>Client Measurements</Text><Text style={styles.sub}>Capture accurate measurements for AI fit analysis.</Text><TextInput placeholder="Client name" style={styles.input}/>{fields.map(x=><View key={x} style={styles.row}><Text style={styles.label}>{x}</Text><View style={styles.inputWrap}><TextInput placeholder="0" keyboardType="numeric" style={styles.value}/><Text style={styles.unit}>in</Text></View></View>)}<PrimaryButton label="Save Measurements" onPress={()=>router.push('/client/1' as any)}/></ScrollView></Screen>
  );
}
const styles=StyleSheet.create({content:{padding:16,paddingBottom:30},title:{fontSize:20,fontWeight:'800',color:colors.text},sub:{fontSize:10,color:colors.muted,marginTop:4,marginBottom:18},input:{height:46,borderWidth:1,borderColor:colors.line,borderRadius:9,backgroundColor:'#fff',paddingHorizontal:12,fontSize:12,marginBottom:10},row:{height:50,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:colors.line},label:{fontSize:11,color:colors.text},inputWrap:{height:34,width:82,borderWidth:1,borderColor:colors.line,borderRadius:8,backgroundColor:'#fff',flexDirection:'row',alignItems:'center'},value:{flex:1,textAlign:'right',fontSize:11,paddingHorizontal:6},unit:{fontSize:9,color:colors.muted,paddingRight:8}})
