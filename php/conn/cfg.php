<?php
$cfg = [
	'mob' => [
	  'host'=> "0.0.0.0",
	  'user' => "dg",
	  'pass' => "Ady.25626",
	  'db' => "test",
	],
	'dsk' => [
	  'host'=> "localhost",
	  'user' => "root",
	  'pass' => "",
	  'db' => "test",
	],
	'lnx' => [
	  'host'=> "localhost",
	  'user' => "root",
	  'pass' => "root",
	  'db' => "test",
	]
];

$mysql = $cfg['mob'];

$profiler = ['queries' => [],
'sel'=>0,'ins'=>0,'upd'=>0,'del'=>0];

function isLikeIncludedIn($needle, array $heystack = []) {
	$itIs = false;

	foreach ($heystack as $hey) {
		$found = 0;
		$heyParts = explode('%', $hey);
		$maxFound = \count($heyParts);
		foreach ($heyParts as $heyPart) {
			if (false !== strpos($needle, $heyPart)) {
				++$found;
				if ($found >= $maxFound) {
					$itIs = true;
					break;
				}
			}
		}
	}

	return $itIs;
}
	
function cQuery($conn, $query) {
	global $profiler;
	$profiler['queries'][] = $query;
	return $conn->query($query);
}

function cExec($stmt, $query, $params = []) {
	global $profiler;
	$dquery = str_replace('?', '"?"', $query);
	//$dquery = str_replace(array_fill(0, count($params),'?'), $params, $dquery);
	foreach($params as $param) {
		$dquery = preg_replace('/\?/', $param, $dquery, 1);
	}
	$profiler['queries'][] = $dquery;
	$stmt->execute();
	if ($stmt->error) {
		throw new \Exception('Bad stmt error: '. $stmt->error);
	}
}

function checkDbIntegrity($conn, $force = 1) {
	$tablesCfg = [ 'dg'=> 'CREATE TABLE `dg` (\n`id` int(10) NOT NULL AUTO_INCREMENT,\n`name` varchar(64) NOT NULL DEFAULT \'\',\n`data` mediumtext,\nPRIMARY KEY (`id`),\nUNIQUE KEY `name` (`name`)\n) ENGINE=InnoDB AUTO_INCREMENT DEFAULT CHARSET=latin1'];

	$autoIncrTest = 'AUTO_INCREMENT=';
	$autoIncr2Test = 'AUTO_INCREMENT ';
		
	foreach($tablesCfg as $name => $cr) {
		$res = cQuery($conn,'Show create table '.$name);
		//$conn->query('Show create table '.$name);
		
		if($conn->error) {
			if (false !== strpos($conn->connect_error, '.'.$name."' doesn't exist")) {
				throw new \Exception('Check db:check error: '. $conn->error);
			}
			//$conn->query($cr);
			cQuery($conn,$cr);
			if($conn->error) {
				throw new \Exception('Check db:create error: '. $conn->error);
			}
		}
		if ($res && $res->num_rows) {
			$result = $res->fetch_row();
			if ($pos = strpos($result[1],$autoIncrTest)) {
				$result[1] = preg_replace('/'.$autoIncrTest . '\d+/', '%', $result[1]);
			}
			
			$crsearch = str_replace(['\n',$autoIncr2Test], ['%','% '], $cr);
			//var_export([$crsearch, $result[1]]);die;
			if (isLikeIncludedIn($result[1], explode('%',$crsearch))) {
				continue;
			} else {
				if ($force) {
					//$conn->query('drop table '.$name);
					cQuery($conn,'drop table '.$name);
					if($conn->error) {
						throw new \Exception('Check db:drop error: '. $conn->error);
					}
					//$conn->query($cr);
					cQuery($conn, $cr);
					if($conn->error) {
						throw new \Exception('Check db:create error: '. $conn->error);
					}
					continue;
				}
				throw new \Exception("Check db:integrity error: Not the same <br><br>{$result[1]}\n<br><br> <> <br><br>{$cr}");
				
			}
		}
	}
}