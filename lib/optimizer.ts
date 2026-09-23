export type Metric = "time" | "distance";

export function routeCost(
  order: number[],
  matrix: number[][],
  roundTrip: boolean,
) {
  let cost = 0;

  for (let i = 1; i < order.length; i++) {
    cost += matrix[order[i - 1]][order[i]];
  }

  return cost + (roundTrip ? matrix[order[order.length - 1]][0] : 0);
}

// Multi-start nearest neighbor followed by directed 2-opt. Keep the input order
// as a candidate so optimization never makes its selected matrix cost worse.
export function optimizeOrder(matrix: number[][], roundTrip: boolean) {
  const n = matrix.length;
  let best = Array.from({ length: n }, (_, i) => i);
  let bestCost = routeCost(best, matrix, roundTrip);

  for (let first = 1; first < n; first++) {
    let order = [0, first];
    const remaining = new Set(best.filter((i) => i !== 0 && i !== first));

    while (remaining.size) {
      const last = order[order.length - 1];
      const next = [...remaining].sort(
        (a, b) => matrix[last][a] - matrix[last][b],
      )[0];
      order.push(next);
      remaining.delete(next);
    }

    let cost = routeCost(order, matrix, roundTrip);

    for (let pass = 0; pass < 100; pass++) {
      let improved = false;

      for (let i = 1; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          const candidate = [
            ...order.slice(0, i),
            ...order.slice(i, j + 1).reverse(),
            ...order.slice(j + 1),
          ];
          const candidateCost = routeCost(candidate, matrix, roundTrip);
          if (candidateCost < cost) {
            order = candidate;
            cost = candidateCost;
            improved = true;
          }
        }
      }

      if (!improved) {
        break;
      }
    }

    if (cost < bestCost) {
      best = order;
      bestCost = cost;
    }
  }

  return best;
}
