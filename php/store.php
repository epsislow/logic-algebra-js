<?php
require_once('conn/cfg.php');

function getConn($mysql) {
  
  // Create connection
  $conn = new mysqli($mysql['host'], $mysql['user'], $mysql['pass'], $mysql['db']);
  
 // echo $username.':'.$password;

  // Check connection
  if ($conn->connect_error) {
	if (false !== strpos($conn->connect_error, "Unknown database")) {
		$conn = new mysqli($mysql['host'], $mysql['user'], $mysql['pass']);
		if ($conn->connect_error) {
			throw new \Exception("Connection failed: " . $conn->connect_error);
		}
		
		//$conn->query('create database '. $mysql['db']);
		cQuery($conn,'create database '. $mysql['db']);
		if ($conn->error) {
			throw new \Exception("Create db failed: " . $conn->error);
		}
		//$conn->query('use '. $mysql['db']);
		cQuery($conn,'use '. $mysql['db']);
	}
    throw new \Exception("Connection failed: " . $conn->connect_error);
  }
  
  checkDbIntegrity($conn);
  
  return $conn;
}

function checkValueExist($name, $value=0, $conn) {
	global $profiler;
  $str = 'Select id from dg where name = ?';
  if($value) {
    $str .= ' and md5(data) = ?';
  }
  $stmt = $conn->prepare($str);
  if(false === $stmt) {
      throw new \Exception('Bad stmt error: '. $conn->error);
  }
  if($value) {
	  $value = md5($value);
	  $stmt->bind_param('ss', $name, $value);
	  cExec($stmt, $str, [$name, $value]);
  } else {
    $stmt->bind_param('s', $name);
	cExec($stmt, $str, [$name]);
  }
  //$stmt->execute();
  $profiler['sel']++;
  
  $res = $stmt->get_result();
  //  die(' '.$name.' '.$value);
  if($res->num_rows >0) {
    $r = $res->fetch_assoc();
    return $r['id'];
  }
  return false;
}

function regData($reg,$conn) {
	global $profiler;
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
   //$stmtu->execute();
   cExec($stmtu, "UPDATE ".$key." SET data =? Where name =?", [$val, $name]);
   
	$profiler['upd']++;
    $res[$name] = $id;
    continue;
             
          } 
   // do insert

          $stmt->bind_param("ss", $name, $val);
          //$stmt->execute();
		  cExec($stmt, "INSERT INTO ".$key." (name,data) VALUES (?,?)", [$name, $val]);
          $res[$name] = $stmt->insert_id;
      
		$profiler['ins']++;
           
        
      }
      
      $stmt->close();
    } catch(\Throwable $e) {
      throw new \Exception('Bad query error:'. $e->getMessage(), 100, $e);
    }
  }
  return $res;
}

function selData($sel,$conn) {
	global $profiler;
    $ret = [];
	$str = 'Select * from dg where name in ('.implode(',',array_fill(0,count($sel),'?')).')';
    $stmt = $conn->prepare($str);
    if(false === $stmt) {
        throw new \Exception('Bad stmt error: '. $conn->error);
    }
   $stmt->bind_param(str_repeat('s',count($sel)), ...$sel);
   //$a='s1';
    
   //$stmt->bind_param('s', ...$sel);
   // array_unshift($sel, str_repeat('s',count($sel)));
    
   // call_user_func_array([$stmt,'bind_param'], $sel);
    
   // die(var_export($sel));
    //$stmt->execute();
	cExec($stmt,$str, $sel);
	$profiler['sel']++;
	  
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

function delData($del, $conn) {
	global $profiler;
  $stmt = 0;
  foreach ($del as $tbl => $val) {
    try{
      if(empty($stmt)) {
        $stmt = $conn->prepare("DELETE FROM {$tbl} WHERE name in (?)");
      }
      if(false === $stmt) {
        throw new \Exception('Bad stmt error: '. $stmt->error);
      }
      $stmt->bind_param("s", $val);
      //$stmt->execute();
	  cExec($stmt,"DELETE FROM {$tbl} WHERE name in (?)", $val);
	  $profiler['del']++;
	  
    } catch (\Throwable $e) {
      throw new \Exception('Bad query error:'. $e->getMessage(),$e);
    }
  }
}

$res = ['error' => 0, 'data' => []];
try {
  $conn = getConn($mysql);

  $data = $_REQUEST['data'];
  
  $data['prof']=1;
  
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
    $res['data']['del'] = delData($data['del'], $conn);
  }
  if(!empty($data['prof'])) {
	$res['data']['prof'] = $profiler;
  }
  $conn->close();
} catch (\Throwable $e) {
  $res['error'] = $e->getMessage();
  $res['stack'] = $e->getTrace();
}
echo json_encode($res);


