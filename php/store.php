<?php


function getConn() {
  $servername = "0.0.0.0";
  $username = "dg";
  $password = "Ady.25626";
  $dbname = "test";

  // Create connection
  $conn = new mysqli($servername, $username, $password, $dbname);
  
 // echo $username.':'.$password;

  // Check connection
  if ($conn->connect_error) {
    throw new \Exception("Connection failed: " . $conn->connect_error);
  }
  
  return $conn;
}

function checkValueExist($name, $value=0, $conn) {
  $str = 'Select id from dg where name = ?';
  if($value) {
    $str .= ' and data = ?';
  }
  $stmt = $conn->prepare($str);
  if(false === $stmt) {
      throw new \Exception('Bad stmt error: '. $conn->error);
  }
  if($value) {
  $stmt->bind_param('ss', $name, $value);
  } else {
    $stmt->bind_param('s', $name);
  }
  $stmt->execute();
  $res = $stmt->get_result();
  //  die(' '.$name.' '.$value);
      
  if($res->num_rows >0) {
    $r = $res->fetch_assoc();
    return $r['id'];
  }
  return false;
}

function regData($reg,$conn) {
  $stmt=0;
  $stmtu=0;
 // var_export(($reg));
  //die;
  $res = [];
  foreach ($reg as $key => $data) {
    try {
      if(!$stmt) {
        $stmt = $conn->prepare("INSERT INTO ".$key." (name,data) VALUES (?,?)");
      }
      if(false === $stmt) {
          throw new \Exception('Bad stmt error: '. $conn->error);
      }
      foreach($data as $name => $val) {
         if($id = checkValueExist($name, $val, $conn)) {
             $res[$name] = $id;
             continue;
          }
          if($id = checkValueExist($name, 0,$conn)) {
   // do update
   if(!$stmtu) {
     $stmtu = $conn->prepare("UPDATE ".$key." SET data =? Where name =?");
   }
   $stmtu->bind_param('ss',$val, $name);
   $stmtu->execute();
   $res['upd'] = $res['upd']??0;
   $res['upd']++;
    $res[$name] = $id;
    continue;
             
          } 
   // do insert
      
          $stmt->bind_param("ss", $name, $val);
          $stmt->execute();
          $res[$name] = $stmt->insert_id;
      
        $res['ins'] = $res['ins']??0;
           $res['ins']++;
           
        
      }
      
      $stmt->close();
    } catch(\Throwable $e) {
      throw new \Exception('Bad query error:'. $e->getMessage());
    }
  }
  return $res;
}

function selData($sel,$conn) {
    $ret = [];
    $stmt = $conn->prepare('Select * from dg where name in (?)');
    if(false === $stmt) {
        throw new \Exception('Bad stmt error: '. $conn->error);
    }
   $stmt->bind_param(str_repeat('s',count($sel)), ...$sel);
   //$a='s1';
    
   //$stmt->bind_param('s', ...$sel);
   // array_unshift($sel, str_repeat('s',count($sel)));
    
   // call_user_func_array([$stmt,'bind_param'], $sel);
    
   // die(var_export($sel));
    $stmt->execute();
    $res = $stmt->get_result();
    
    //die(var_export($res));
      
    if($res->num_rows >0) {
      while($r = $res->fetch_assoc()) {
        //die(var_export($r));
        $ret[$r['name']] = $r['data'];
      }
    }
    
    return $ret;
}

function delData($del,$conn) {
  $stmt = 0;
  foreach ($del as $tbl => $val) {
    try{
      if(empty($stmt)) {
        $stmt = $mysqli->prepare("DELETE FROM ? WHERE name in (?)");
      }
      if(false === $stmt) {
        throw new \Exception('Bad stmt error: '. htmlspecialchars($stmt->error));
      }
      $stmt->bind_param("s", $tbl, $value);
      $stmt->execute();
    } catch (\Throwable $e) {
      throw new \Exception('Bad query error:'. $e->getMessage(),$e);
    }
  }
}

$res = ['error' => 0, 'data' => []];
try {
  $conn = getConn();

  $data = $_REQUEST['data'];
  
  if(is_string($data)){
    $data = json_decode($data,1);
  }
  if(empty($data)) {
    throw new \Exception( 'Data not provided!');
  }

  if(!empty($data['sel'])) {
    $res['data']['sel'] = selData($data['sel'], $conn);
  }
  if(!empty($data['reg'])) {
    $res['data']['reg'] = regData($data['reg'], $conn);
  }
  if(!empty($data['del'])) {
    //$res['data']['del'] = delData($data['del'], $conn);
  }
  $conn->close();
} catch (\Throwable $e) {
  $res['error'] = $e->getMessage();
  $res['stack'] = $e->getTrace();
}
echo json_encode($res);


