/**
 * Converts an IPv4 string to a 32-bit integer.
 * Returns null if the format is invalid.
 */
function ipToLong(ip: string): number | null {
  // 检查空字符串
  if (!ip || ip.trim() === '') {
    return null;
  }

  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    // 检查空部分
    if (part.trim() === '') {
      return null;
    }

    // 检查前导零（如 01, 001）
    if (part.length > 1 && part.startsWith('0')) {
      return null;
    }

    const num = parseInt(part, 10);

    // 验证数字有效性
    if (isNaN(num) || num < 0 || num > 255) return null;

    result = ((result << 8) + num) >>> 0;
  }
  return result >>> 0; // Ensure unsigned
}

/**
 * Checks if two IP addresses are in the same subnet given a subnet mask.
 *
 * @param gateway - The gateway IP address
 * @param ipAddress - The host IP address
 * @param subnetMask - The subnet mask
 * @returns true if both are in the same subnet, false otherwise
 */
export function isIpInSubnet(gateway: string, ipAddress: string, subnetMask: string): boolean {
  const gatewayLong = ipToLong(gateway);
  const ipLong = ipToLong(ipAddress);
  const maskLong = ipToLong(subnetMask);

  if (gatewayLong === null || ipLong === null || maskLong === null) {
    return false;
  }

  // Calculate Network Address for both
  const gatewayNetwork = (gatewayLong & maskLong) >>> 0;
  const ipNetwork = (ipLong & maskLong) >>> 0;

  return gatewayNetwork === ipNetwork;
}
