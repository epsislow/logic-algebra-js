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

function regData($reg) {
  $stmt=0;
  foreach ($reg as $key => $data) {
    try {
      if(!$stmt) {
        $stmt = $conn->prepare("REPLACE INTO ? (name,data) VALUES (?, ?)");
      }
      if(false === $stmt) {
          throw new \Exception('Bad stmt error: '. htmlspecialchars($stmt->error));
      }
      foreach($data as $name => $val) {
          $stmt->bind_param("s", $key, $name, $val);
          $stmt->execute();
          //$stmt->insert_id;
      }
      
      $stmt->close();
    } catch(\Throwable $e) {
      throw new \Exception('Bad query error:'. $e->getMessage(),$e);
    }
  }
}

function delData($del) {
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
  if(empty($data)) {
    throw new \Exception( 'Data not provided!');
  }

  if(!empty($data['res'])) {
    $res['data']['reg'] = regData($data['reg']);
  }
  if(!empty($data['del'])) {
    $res['data']['del'] = delData($data['del']);
  }
  $conn->close();
} catch (\Throwable $e) {
  $res['error'] = $e->getMessage();
  $res['stack'] = $e->getTrace();
}
echo json_encode($res);


