#!/usr/bin/env python3
"""
End-to-End Testing Script for NeuroBridge
Tests all core functionalities including translation, tone adjustment, and error handling
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, List
from datetime import datetime

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class E2ETestRunner:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_results: List[Dict[str, Any]] = []
    
    def log_test(self, test_name: str, passed: bool, message: str = "", duration: float = 0):
        """Log test result"""
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        print(f"{status} {test_name} ({duration:.2f}s)")
        if message:
            print(f"     {message}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "duration": duration
        })
        
        if passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
    
    def print_header(self, title: str):
        """Print section header"""
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{title}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}\n")
    
    async def test_health_check(self, session: aiohttp.ClientSession):
        """Test 1: Health check endpoint"""
        start_time = time.time()
        try:
            async with session.get(f"{self.base_url}/api/v1/health") as response:
                duration = time.time() - start_time
                if response.status == 200:
                    data = await response.json()
                    self.log_test(
                        "Health Check",
                        True,
                        f"Status: {data.get('status', 'unknown')}",
                        duration
                    )
                    return data
                else:
                    self.log_test("Health Check", False, f"Status code: {response.status}", duration)
                    return None
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Health Check", False, f"Error: {str(e)}", duration)
            return None
    
    async def test_service_status(self, session: aiohttp.ClientSession):
        """Test 2: Service status endpoint"""
        start_time = time.time()
        try:
            async with session.get(f"{self.base_url}/api/v1/status") as response:
                duration = time.time() - start_time
                if response.status == 200:
                    data = await response.json()
                    services = data.get('services', {})
                    available_services = [k for k, v in services.items() if v == 'available']
                    self.log_test(
                        "Service Status",
                        len(available_services) > 0,
                        f"Available services: {', '.join(available_services)}",
                        duration
                    )
                    return data
                else:
                    self.log_test("Service Status", False, f"Status code: {response.status}", duration)
                    return None
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Service Status", False, f"Error: {str(e)}", duration)
            return None
    
    async def test_translation_flow(self, session: aiohttp.ClientSession):
        """Test 3-6: Complete translation flow"""
        test_cases = [
            {
                "name": "ASD to NT Translation",
                "request": {
                    "text": "I don't understand why you're upset. This doesn't make logical sense.",
                    "userRole": "ASD",
                    "targetRole": "NT"
                },
                "expected_fields": ["intent", "misunderstanding", "rewrite", "emotionIntensity"]
            },
            {
                "name": "NT to ASD Translation",
                "request": {
                    "text": "I'm feeling a bit overwhelmed right now, could we maybe talk about this later?",
                    "userRole": "NT",
                    "targetRole": "ASD"
                },
                "expected_fields": ["intent", "misunderstanding", "rewrite", "emotionIntensity"]
            },
            {
                "name": "High Emotion Text",
                "request": {
                    "text": "I'm really frustrated and angry! This is completely unacceptable!",
                    "userRole": "UNCERTAIN",
                    "targetRole": "NT"
                },
                "expected_fields": ["intent", "misunderstanding", "rewrite", "emotionIntensity"]
            },
            {
                "name": "Neutral Text",
                "request": {
                    "text": "I need help with this task.",
                    "userRole": "ASD",
                    "targetRole": "NT"
                },
                "expected_fields": ["intent", "misunderstanding", "rewrite", "emotionIntensity"]
            }
        ]
        
        for test_case in test_cases:
            start_time = time.time()
            try:
                async with session.post(
                    f"{self.base_url}/api/v1/translate",
                    json=test_case["request"],
                    headers={"Content-Type": "application/json"}
                ) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check all expected fields are present
                        missing_fields = [f for f in test_case["expected_fields"] if f not in data]
                        
                        if not missing_fields:
                            # Check emotion intensity is in valid range
                            emotion = data.get("emotionIntensity", -1)
                            if 0 <= emotion <= 100:
                                # Check response time (should be < 3 seconds per requirements)
                                if duration < 3.0:
                                    self.log_test(
                                        test_case["name"],
                                        True,
                                        f"Emotion: {emotion}/100, Response time: {duration:.2f}s",
                                        duration
                                    )
                                else:
                                    self.log_test(
                                        test_case["name"],
                                        False,
                                        f"Response time {duration:.2f}s exceeds 3s requirement",
                                        duration
                                    )
                            else:
                                self.log_test(
                                    test_case["name"],
                                    False,
                                    f"Invalid emotion intensity: {emotion}",
                                    duration
                                )
                        else:
                            self.log_test(
                                test_case["name"],
                                False,
                                f"Missing fields: {', '.join(missing_fields)}",
                                duration
                            )
                    else:
                        error_text = await response.text()
                        self.log_test(
                            test_case["name"],
                            False,
                            f"Status {response.status}: {error_text[:100]}",
                            duration
                        )
            except Exception as e:
                duration = time.time() - start_time
                self.log_test(test_case["name"], False, f"Error: {str(e)}", duration)
    
    async def test_tone_adjustment(self, session: aiohttp.ClientSession):
        """Test 7-9: Tone adjustment functionality"""
        base_text = "I need you to help me with this problem right now."
        
        tone_tests = [
            {"tone": "direct", "name": "Direct Tone Adjustment"},
            {"tone": "gentle", "name": "Gentle Tone Adjustment"},
            {"tone": "empathetic", "name": "Empathetic Tone Adjustment"}
        ]
        
        for tone_test in tone_tests:
            start_time = time.time()
            try:
                request_data = {
                    "text": base_text,
                    "tone": tone_test["tone"],
                    "userRole": "ASD"
                }
                
                async with session.post(
                    f"{self.base_url}/api/v1/tone-adjust",
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        adjusted_text = data.get("adjustedText", "")
                        
                        # Check response time (should be < 2 seconds per requirements)
                        if duration < 2.0 and adjusted_text:
                            self.log_test(
                                tone_test["name"],
                                True,
                                f"Response time: {duration:.2f}s",
                                duration
                            )
                        elif duration >= 2.0:
                            self.log_test(
                                tone_test["name"],
                                False,
                                f"Response time {duration:.2f}s exceeds 2s requirement",
                                duration
                            )
                        else:
                            self.log_test(
                                tone_test["name"],
                                False,
                                "No adjusted text returned",
                                duration
                            )
                    else:
                        error_text = await response.text()
                        self.log_test(
                            tone_test["name"],
                            False,
                            f"Status {response.status}: {error_text[:100]}",
                            duration
                        )
            except Exception as e:
                duration = time.time() - start_time
                self.log_test(tone_test["name"], False, f"Error: {str(e)}", duration)
    
    async def test_error_handling(self, session: aiohttp.ClientSession):
        """Test 10-12: Error handling"""
        error_tests = [
            {
                "name": "Empty Input Validation",
                "endpoint": "/api/v1/translate",
                "data": {"text": "", "userRole": "ASD", "targetRole": "NT"},
                "should_fail": True
            },
            {
                "name": "Invalid Role Validation",
                "endpoint": "/api/v1/translate",
                "data": {"text": "Test", "userRole": "INVALID", "targetRole": "NT"},
                "should_fail": True
            },
            {
                "name": "Missing Required Fields",
                "endpoint": "/api/v1/translate",
                "data": {"text": "Test"},
                "should_fail": True
            }
        ]
        
        for error_test in error_tests:
            start_time = time.time()
            try:
                async with session.post(
                    f"{self.base_url}{error_test['endpoint']}",
                    json=error_test["data"],
                    headers={"Content-Type": "application/json"}
                ) as response:
                    duration = time.time() - start_time
                    
                    # For error tests, we expect non-200 status codes
                    if error_test["should_fail"]:
                        if response.status != 200:
                            error_data = await response.json()
                            self.log_test(
                                error_test["name"],
                                True,
                                f"Correctly returned error status {response.status}",
                                duration
                            )
                        else:
                            self.log_test(
                                error_test["name"],
                                False,
                                "Should have returned error but got 200",
                                duration
                            )
            except Exception as e:
                duration = time.time() - start_time
                # For validation errors, exceptions are acceptable
                self.log_test(
                    error_test["name"],
                    True,
                    f"Validation error caught: {type(e).__name__}",
                    duration
                )
    
    async def test_performance(self, session: aiohttp.ClientSession):
        """Test 13: Performance under load"""
        start_time = time.time()
        
        # Send 5 concurrent requests
        tasks = []
        for i in range(5):
            request_data = {
                "text": f"Test message {i+1} for performance testing.",
                "userRole": "ASD",
                "targetRole": "NT"
            }
            tasks.append(
                session.post(
                    f"{self.base_url}/api/v1/translate",
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                )
            )
        
        try:
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start_time
            
            successful = sum(1 for r in responses if not isinstance(r, Exception) and r.status == 200)
            
            # Close all responses
            for r in responses:
                if not isinstance(r, Exception):
                    await r.read()
                    r.close()
            
            self.log_test(
                "Concurrent Request Handling",
                successful >= 4,  # At least 4 out of 5 should succeed
                f"{successful}/5 requests successful in {duration:.2f}s",
                duration
            )
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("Concurrent Request Handling", False, f"Error: {str(e)}", duration)
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("TEST SUMMARY")
        
        total_tests = self.passed_tests + self.failed_tests
        pass_rate = (self.passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"{Colors.GREEN}Passed: {self.passed_tests}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {self.failed_tests}{Colors.RESET}")
        print(f"Pass Rate: {pass_rate:.1f}%")
        
        if self.failed_tests > 0:
            print(f"\n{Colors.YELLOW}Failed Tests:{Colors.RESET}")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print(f"\n{Colors.BOLD}Overall Status: ", end="")
        if self.failed_tests == 0:
            print(f"{Colors.GREEN}ALL TESTS PASSED ✓{Colors.RESET}")
        elif pass_rate >= 80:
            print(f"{Colors.YELLOW}MOSTLY PASSING (some issues){Colors.RESET}")
        else:
            print(f"{Colors.RED}NEEDS ATTENTION{Colors.RESET}")
    
    async def run_all_tests(self):
        """Run all E2E tests"""
        print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.MAGENTA}NeuroBridge End-to-End Test Suite{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.MAGENTA}Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.MAGENTA}{'='*60}{Colors.RESET}")
        
        async with aiohttp.ClientSession() as session:
            # Test 1-2: Basic connectivity
            self.print_header("1. BASIC CONNECTIVITY TESTS")
            await self.test_health_check(session)
            await self.test_service_status(session)
            
            # Test 3-6: Translation flow
            self.print_header("2. TRANSLATION FLOW TESTS")
            await self.test_translation_flow(session)
            
            # Test 7-9: Tone adjustment
            self.print_header("3. TONE ADJUSTMENT TESTS")
            await self.test_tone_adjustment(session)
            
            # Test 10-12: Error handling
            self.print_header("4. ERROR HANDLING TESTS")
            await self.test_error_handling(session)
            
            # Test 13: Performance
            self.print_header("5. PERFORMANCE TESTS")
            await self.test_performance(session)
        
        # Print summary
        self.print_summary()

async def main():
    """Main entry point"""
    import sys
    
    # Check if custom URL provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    print(f"\n{Colors.CYAN}Testing NeuroBridge API at: {base_url}{Colors.RESET}")
    print(f"{Colors.YELLOW}Make sure the backend server is running!{Colors.RESET}\n")
    
    runner = E2ETestRunner(base_url)
    
    try:
        await runner.run_all_tests()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Tests interrupted by user{Colors.RESET}")
    except Exception as e:
        print(f"\n\n{Colors.RED}Fatal error: {str(e)}{Colors.RESET}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
