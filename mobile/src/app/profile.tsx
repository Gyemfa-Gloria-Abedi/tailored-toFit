import { StyleSheet, Text, View } from 'react-native';
import { BottomNav, Card, Screen } from '../components';
import { colors } from '../theme';
export default function Profile(){
  return (
    <Screen><View style={styles.root}><View style={styles.center}><View style={styles.avatar}><Text style={styles.avatarText}>T</Text></View><Text style={styles.name}>Tailored toFit</Text><Text style={styles.sub}>AI-powered tailoring workspace</Text></View><Card><Text style={styles.heading}>Workspace</Text><Text style={styles.row}>Business profile <Text>›</Text></Text><Text style={styles.row}>Measurement settings <Text>›</Text></Text><Text style={styles.row}>AI preferences <Text>›</Text></Text><Text style={styles.row}>Privacy & security <Text>›</Text></Text></Card><View style={{flex:1}}/><BottomNav active="Profile"/></View></Screen>
  );
}
const styles=StyleSheet.create({root:{flex:1,padding:16},center:{alignItems:'center',marginTop:45,marginBottom:25},avatar:{width:82,height:82,borderRadius:41,backgroundColor:colors.deep,alignItems:'center',justifyContent:'center'},avatarText:{color:colors.gold,fontSize:34,fontWeight:'800'},name:{fontSize:19,fontWeight:'800',color:colors.text,marginTop:12},sub:{fontSize:12,color:colors.muted,marginTop:4},heading:{fontSize:14,fontWeight:'800',color:colors.text,marginBottom:5},row:{fontSize:13,color:colors.text,paddingVertical:14,borderBottomWidth:1,borderBottomColor:colors.line}})
