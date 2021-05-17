<?php
function work($data) {
        $startTime = microtime(true);
        while((microtime(true) - $startTime)*1000 < (int)$data['duration']) {
            $sha = hash('sha256', $data['test'] . $data['nounce']);
            $data['nounce']++;
            $data['trys']++;
            $checker = str_pad('', $data['difc'],".", STR_PAD_LEFT);
            if ($data['methodCheck'] == 1) {
                $test = (substr($sha, 0, $data['difc']) == str_pad('', $data['difc'],".", STR_PAD_LEFT));
                if ($test) {
                    $data['difc']++;
                }
            } else {
                $newDifc = substr_count($sha, '0');
                $test = $newDifc >= $data['difc'];
                if ($test) {
                    $data['difc'] = $newDifc;
                }
            }
            $data['content'] = 'Nounce ' . $data['nounce'] . ":\n".$sha."\n";
            if ($test) {
                $data['desc'] = "Difc is ". $data['difc'] ."\nNounce is ".$data['nounce'] ."\nSha: ". sha . "\nYes!\n\n";
                $data['needsToSave'] = 1;
                $data['intrval'] = (new \DateTime())->getTimestamp() - $startTime;
                echo json_encode($data);
                return;
            }
            if (microtime(true) - $startTime > 2000) {
                    die('nop');
            }
        }
        $data['intrval'] = (new \DateTime())->getTimestamp() - $startTime;
        echo json_encode($data);

        return;
    }

$data = $_REQUEST['data'] ?? [];


if (empty($data)) {
    echo json_encode(['error'=> 'No data provided']);
}

foreach($data as $k => &$dat) {
    if (!in_array($k, ['test','content','desc'])) {
        $dat = (int)$dat;
    }
}
unset($dat);

work($data);


