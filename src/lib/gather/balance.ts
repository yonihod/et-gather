interface Player {
  userId: string;
  attendancePoints: number;
}

interface BalancedTeams {
  team1: Player[];
  team2: Player[];
}

function teamSum(team: Player[]): number {
  return team.reduce((s, p) => s + p.attendancePoints, 0);
}

export function balanceTeams(players: Player[]): BalancedTeams {
  const sorted = [...players].sort(
    (a, b) => b.attendancePoints - a.attendancePoints
  );
  const team1: Player[] = [];
  const team2: Player[] = [];

  // Snake draft: 1,2,2,1,1,2,2,1...
  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / 2);
    const pick = i % 2;
    if ((round % 2 === 0 && pick === 0) || (round % 2 === 1 && pick === 1)) {
      team1.push(sorted[i]);
    } else {
      team2.push(sorted[i]);
    }
  }

  // Refinement: try single swaps to reduce difference
  let improved = true;
  while (improved) {
    improved = false;
    let bestDiff = Math.abs(teamSum(team1) - teamSum(team2));

    for (let i = 0; i < team1.length; i++) {
      for (let j = 0; j < team2.length; j++) {
        // Swap
        [team1[i], team2[j]] = [team2[j], team1[i]];
        const newDiff = Math.abs(teamSum(team1) - teamSum(team2));
        if (newDiff < bestDiff) {
          bestDiff = newDiff;
          improved = true;
        } else {
          // Swap back
          [team1[i], team2[j]] = [team2[j], team1[i]];
        }
      }
    }
  }

  return { team1, team2 };
}
